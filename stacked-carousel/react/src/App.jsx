import { useMemo, useRef, useState } from 'react'
import './App.css'
import { useDrag } from "@use-gesture/react";
import { throttle } from "lodash-es";
import { useRafInterval } from "ahooks";

// 展示3层，则转换后的数组长度至少为6
// origin length: 6
// loop length: 2 + 6 + 2
// 当 activeIndex: 0 || 7
// rest animation && offset:
// nextActiveIndex: 0 -> 6(data.length - 4) || 7 -> 1
const data = [
  // extra data.slice(-2)
  { title: '0', value: 0, bgColor: "cornsilk" },
  { title: '1', value: 1, bgColor: "lightblue" },
  { title: '2', value: 2, bgColor: "lightgreen" },
  { title: '3', value: 3, bgColor: "lightgray" },
  { title: '4', value: 4, bgColor: "floralwhite" },
  { title: '5', value: 5, bgColor: "gold" },
  { title: '6', value: 6, bgColor: "tomato" },
  // extra data.slice(0,2)
]


function App() {
  const [activeIndex, setActiveIndex] = useState(2)
  const [transition, setTransition] = useState(true)
  const [interval, setInterval] = useState(2500);
  
  const timeoutIdRef = useRef(0)
  // minLength: 6
  const carouselData = useMemo(() => {
    if (!data.length) return []
    if (data.length < 2) {
      return Array(6).fill(data[0], 0).map((item, i) => ({
        ...item,
        value: i,
      }))
    }
    return [data.slice(-2).map((item) => ({
      ...item,
      value: 'before-extra-' + item.value,
    })), data, data.slice(0, 2).map((item) => ({
      ...item,
      value: 'after-extra-' + item.value,
    }))].flat()
  }, [])
  
  
  const toggleIndexFnRef = useRef((next = true) => {
      let nextIndex = 0
      clearTimeout(timeoutIdRef.current)
      setTransition(true)
      setActiveIndex((prevIndex) => {
        if (next) {
          if (prevIndex < carouselData.length - 3) {
            nextIndex = prevIndex + 1
            return nextIndex
          } else {
            nextIndex = carouselData.length - 3
            return nextIndex
          }
        } else {
          if (prevIndex > 0) {
            nextIndex = prevIndex - 1
            return nextIndex
          } else return 0
        }
      })
      // 轮播循环
      // 动画结束，偏移归位（重置索引）
      timeoutIdRef.current = setTimeout(() => {
        // 取消动画
        if (nextIndex === 0 || nextIndex === carouselData.length - 3) {setTransition(false)}
        if (nextIndex === 0) {
          setActiveIndex(carouselData.length - 4)
        } else if (nextIndex === carouselData.length - 3) {
          setActiveIndex(1)
        }
      }, 500)
    },
  )
  
  const toggleIndex = useMemo(() => throttle(toggleIndexFnRef.current, 500, { trailing: false }), [])
  
  const clearIntervalFn = useRafInterval(() => {
    toggleIndex()
  }, interval);
  
  const handleSwiper = (next = true) => {
    // 停止自动轮播
    clearIntervalFn()
    setInterval(undefined)
    toggleIndex(next)
    // 开启自动轮播
    setTimeout(() => {
      setInterval(2500)
    }, 800)
  }
  
  const bind = useDrag(({ last, direction: [xDir], ...state }) => {
    if (last) {
      handleSwiper(!~xDir)
    }
  }, { axis: "x", threshold: 80 })
  
  
  return (
    <div className="main">
      <div className="carousel">
        <div className="list" {...bind()}>
          {carouselData.map((item, index) => <CarouselItem key={item.value} item={item} index={index}
                                                           activeIndex={activeIndex}
                                                           transition={transition} />)}
        </div>
      </div>
      <h3>activeIndex: {activeIndex}</h3>
      <div className="btn-group">
        <button className="prev" type="button" onClick={() => handleSwiper(false)}>Prev</button>
        <button className="next" type="button" onClick={() => handleSwiper()}>Next</button>
      </div>
    </div>
  )
}

const CarouselItem = ({ item, index, activeIndex, transition }) => {
  const curIndexDiff = index - activeIndex;
  // curIndexDiff === -1 为即将消失的项（next 时机，activeIndex 出现，activeIndex - 1 消失）
  const scaleValue = curIndexDiff === -1 ? 0.5 : 1 - 0.1 * Math.abs(curIndexDiff);
  const translate3dValue = curIndexDiff === -1 ? -150 : (index - activeIndex) * 50;
  const zIndex = 10 - index;
  // 仅渲染必要子项
  if (index - activeIndex > 3 || index - activeIndex < -1) return null
  return <div
    className="item" style={{
    background: item.bgColor,
    transform: `translate3d(${translate3dValue}px,0,0) scale(${scaleValue})`,
    zIndex: zIndex,
    transition: transition ? undefined : "none",
    visibility: (index < activeIndex || (index - activeIndex) > 2) ? 'hidden' : "visible",
    opacity: (index < activeIndex || (index - activeIndex) > 2) ? 0.1 : 1,
  }}>
    <h3>{item.title}</h3>
  </div>
}

export default App
