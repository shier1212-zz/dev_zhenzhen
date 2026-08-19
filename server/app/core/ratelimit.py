"""进程内内存限流（固定窗口计数）。

用途：留言限流（/public/messages 单 IP 5 分钟最多 3 条）。
进程内实现，单实例部署足够；多实例部署时需迁移到 Redis（预留接口）。
"""
import threading
import time


class RateLimiter:
    """固定窗口限流器：key 在 window_seconds 内最多允许 limit 次。"""

    def __init__(self) -> None:
        self._store: dict[str, tuple[int, float]] = {}  # key -> (count, window_start)
        self._lock = threading.Lock()

    def allow(self, key: str, limit: int, window_seconds: int) -> bool:
        """是否放行当前请求。"""
        now = time.time()
        with self._lock:
            count, start = self._store.get(key, (0, now))
            if now - start >= window_seconds:
                # 窗口过期，重置
                self._store[key] = (1, now)
                return True
            if count >= limit:
                return False
            self._store[key] = (count + 1, start)
            return True

    def remaining(self, key: str, limit: int, window_seconds: int) -> int:
        """当前窗口剩余可放行次数（用于响应提示）。"""
        now = time.time()
        with self._lock:
            count, start = self._store.get(key, (0, now))
            if now - start >= window_seconds:
                return limit
            return max(0, limit - count)


# 全局留言限流实例
message_limiter = RateLimiter()
