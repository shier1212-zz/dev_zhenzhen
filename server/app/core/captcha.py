"""SVG 图形验证码（进程内会话存储，不引入 Redis）。

设计（开发技术文档 §5.3）：
- 4 位字符，剔除易混淆字符（0/O/1/l/I）
- 服务端生成 SVG 字符串（随机色 + 干扰线 + 噪点），校验时大小写不敏感
- 内存 dict 存储：captcha_id -> (code, expire_at)，有效期 5 分钟，惰性清理
"""
import random
import string
import threading
import time
import uuid

# 剔除易混淆字符后的字符集
_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

# 内存存储：{captcha_id: (code_lower, expire_ts)}
_STORE: dict[str, tuple[str, float]] = {}
_LOCK = threading.Lock()
_TTL_SECONDS = 300  # 5 分钟
_MAX_STORE = 1000  # 防止内存无限增长


def _cleanup() -> None:
    """惰性清理过期项。"""
    now = time.time()
    expired = [k for k, (_, exp) in _STORE.items() if exp < now]
    for k in expired:
        _STORE.pop(k, None)


def generate() -> dict:
    """生成验证码，返回 {captcha_id, svg, code}。"""
    with _LOCK:
        _cleanup()
        # 存储超限时清空最旧部分
        if len(_STORE) >= _MAX_STORE:
            _STORE.clear()

        code = "".join(random.choices(_CHARS, k=4))
        captcha_id = uuid.uuid4().hex
        _STORE[captcha_id] = (code.lower(), time.time() + _TTL_SECONDS)

    return {"captcha_id": captcha_id, "svg": _render_svg(code), "code": code}


def verify(captcha_id: str, code: str) -> bool:
    """校验验证码（大小写不敏感，一次性使用）。"""
    if not captcha_id or not code:
        return False
    with _LOCK:
        item = _STORE.pop(captcha_id, None)  # 一次性：无论对错都失效
        if item is None:
            return False
        stored, exp = item
        if exp < time.time():
            return False
        return stored == code.strip().lower()


def _render_svg(code: str) -> str:
    """生成带干扰的 SVG 验证码字符串。"""
    width, height = 120, 44
    colors = ["#0E9384", "#1D7A8C", "#5B6CBF", "#B96F2C", "#7A5BA8"]
    bg = "#F4F7F7"

    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" '
        f'viewBox="0 0 {width} {height}">',
        f'<rect width="{width}" height="{height}" fill="{bg}" rx="6"/>',
    ]

    # 干扰线 3 条
    for _ in range(3):
        x1, y1 = random.randint(0, width), random.randint(0, height)
        x2, y2 = random.randint(0, width), random.randint(0, height)
        color = random.choice(colors)
        parts.append(
            f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" '
            f'stroke="{color}" stroke-opacity="0.45" stroke-width="1.5"/>'
        )

    # 噪点 24 个
    for _ in range(24):
        x, y = random.randint(0, width), random.randint(0, height)
        r = random.choice([1, 1.5, 2])
        parts.append(
            f'<circle cx="{x}" cy="{y}" r="{r}" fill="{random.choice(colors)}" opacity="0.5"/>'
        )

    # 字符（轻微随机旋转与偏移）
    char_w = width // (len(code) + 1)
    for i, ch in enumerate(code):
        x = char_w * (i + 1) - 6
        y = 30 + random.randint(-3, 3)
        rot = random.randint(-18, 18)
        color = random.choice(colors)
        parts.append(
            f'<text x="{x}" y="{y}" font-family="Arial, sans-serif" font-size="26" '
            f'font-weight="bold" fill="{color}" transform="rotate({rot} {x} {y})">{ch}</text>'
        )

    parts.append("</svg>")
    return "".join(parts)
