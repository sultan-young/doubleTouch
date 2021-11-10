class TouchEvent {
    constructor({el, onDrag, onZoom, maxZoom, minZoom, baseZoom}) {
        this.el = el;
        this.onDrag = onDrag;
        this.onZoom = onZoom;
        this.baseZoom = baseZoom;
        this.maxZoom = maxZoom;
        this.minZoom = minZoom;
        this.init()
    }
    init() {
        const touchEvents = this.doubleTouchEvent();
        this.bindTouchEvent(this.el, touchEvents)
    }
    bindTouchEvent(el, touchEvents) {
        el.addEventListener('touchstart', touchEvents.touchStart, {
        passive: false,
        });
        el.addEventListener('touchmove', touchEvents.touchMove, {
            passive: false,
            capture: true,
        });
        el.addEventListener('touchend', touchEvents.touchEnd, { passive: false });
    }
    doubleTouchEvent = () => {
        const self = this;
        let lastZoom = null;
        let lastTouchesInfo = [];
        const { maxZoom, minZoom } = this || {};

        // 得到两点距离
        function getDistance(p1, p2) {
            const x = p2.pageX - p1.pageX;
            const y = p2.pageY - p1.pageY;
            return Math.sqrt(x * x + y * y);
        }

        function getTouchesInfo(touches) {
            const touchList = Object.values(touches);
            return touchList.map((touch) => ({
                pageX: touch.pageX,
                pageY: touch.pageY,
            }));
        }

        // 通过余弦求角度
        function getCosDeg(cos) {
            let result = Math.acos(cos) / (Math.PI / 180);
            result = Math.round(result);
            return result;
        }

        // 根据两组点判断双指手势类型
        function decideTouchEvent(current = [], last = []) {
            let touchEventType = null;
            const [cPointA, cPointB] = current;
            const [lPointA, lPointB] = last;

            const newSide = {
                pageX: cPointB.pageX - (lPointB.pageX - lPointA.pageX),
                pageY: cPointB.pageY - (lPointB.pageY - lPointA.pageY),
            };
            const sideA = getDistance(cPointA, lPointA);
            const sideB = getDistance(cPointB, lPointB);
            const sideC = getDistance(cPointA, newSide);
            const deg = getCosDeg(
                (sideA * sideA + sideB * sideB - sideC * sideC) / (2 * sideA * sideB),
            );

            // 两指夹角为60度以下为拖动，否则为缩放
            if (deg <= 90 || !deg) {
                touchEventType = 'drag';
            } else {
                touchEventType = 'zoom';
            }
            return touchEventType;
        }

        // 缩放画布
        function touchZoomLayout(currentTouches, startTouches) {
            if (!lastZoom) {
                lastZoom = self.zoom;
            }

            const reduce = 200;

            const distance =
                getDistance(startTouches[0], startTouches[1]) -
                getDistance(currentTouches[0], currentTouches[1]);
            const deltaY = distance;
            const zoomScale = deltaY / reduce;
            const zoom = (1 - (zoomScale / 2) * 0.8);
            const _zoom = Math.min(maxZoom, Math.max(minZoom, zoom));
            self.onZoom(_zoom);
        }

        function singleScrollHandle(event) {
            const currentTouches = event.touches; // 得到第二组两个点
            const currentTouchesInfo = getTouchesInfo(currentTouches);

            // 防止双指滑动时候突然抬起一只手指引起的抖动
            if (lastTouchesInfo.length > 1) {
                lastTouchesInfo = currentTouchesInfo;
                return;
            }
            self.onDrag({
                dx: currentTouchesInfo[0].pageX - lastTouchesInfo[0].pageX,
                dy: currentTouchesInfo[0].pageY - lastTouchesInfo[0].pageY,
            })
            lastTouchesInfo = currentTouchesInfo;
        }

        // 防抖函数
        function throttle(fn, interval) {
            let flag = false;
            return (event)=> {
                if(flag) {
                  return;
                };
                flag = true;
                const throttleTimer = setTimeout(() => {
                    clearTimeout(throttleTimer)
                    flag = false;
                    fn(event);
                }, interval);
            };
        }

        const singleScrollHandleThrottle = throttle(singleScrollHandle, 20);
        const doubleHandleThrottle = throttle((event) => {
            // 判断是否有两个点在屏幕上
            const currentTouches = event.touches; // 得到第二组两个点
            const currentTouchesInfo = getTouchesInfo(currentTouches);
            const eventType = decideTouchEvent(currentTouchesInfo, lastTouchesInfo);

            if (eventType === 'drag') {
                self.onDrag({
                    dx: currentTouchesInfo[0].pageX - lastTouchesInfo[0].pageX,
                    dy: currentTouchesInfo[0].pageY - lastTouchesInfo[0].pageY,
                })
            } else if (eventType === 'zoom') {
                touchZoomLayout(currentTouchesInfo, lastTouchesInfo);
            }
            lastTouchesInfo = currentTouchesInfo;
        }, 20);

        return {
            touchStart(event) {
                lastTouchesInfo = getTouchesInfo(event.touches);
            },
            touchMove(event) {
                event.preventDefault();
                if (event.touches.length === 2) {
                    doubleHandleThrottle(event);
                } else if (event.touches.length === 1) {
                    singleScrollHandleThrottle(event)
                }
            },
            touchEnd() {
                lastZoom = self.zoom;
            },
        };
    };
};
