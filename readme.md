## 描述
> 这是一个双指手势库，主要用于区分双指滑动和缩放手势。 暂无旋转手势

## 下载
```javascript
npm install double_touch
```

## 如何使用
```javascript
import doubleToucm from 'double_touch'
const box = document.getElementsByClassName('box')[0]
const touchEvent = new TouchEvent({
    el: box,
    onZoom(zoom){
        // do some thing
    },
    onDrag(object) {
        // do some thing
    },
})
```

## 配置
```javascript
{
    el: el, // 开启双指手势识别的区域
    baseZoom: 1, // 缩放基础指
    onZoom(zoom){}, // 缩放回调 zoom=> 缩放比例
    onDrag(object) {}, // 拖动回调 
    maxZoom: 5, // 最大缩放边界
    minZoom: 0.15, // 最小缩放边界
    singleTouchEnabled: true, // 是否监听单指移动
}
```

