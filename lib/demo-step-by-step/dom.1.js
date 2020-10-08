// 1. createElement Stub

const TinyReact = (function () {
    function createElement(type, attributes = {}, ...children) {
        const childrenElements = [].concat(...children).reduce(
            (acc, child) =>  {
            if (child !== null && child !== true && child !== false) {
                if (child instanceof Object) {
                    acc.push(child)
                } else {
                    acc.push(createElement('text', {
                        textContent: child,
                    }))
                }
            }
            return acc
        }, [])
        return {
            type,
            children: childrenElements,
            props: Object.assign({
                children: childrenElements
            }, attributes),
        }
    }
    const mountElement = function mountElement(vdom, container, oldDom) {
        // 映射原生
        return mountDimpleNode(vdom, container, oldDom)
    }

    const mountDimpleNode = function mountDimpleNode(vdom, container, oldDomElement, parentComponent) {
        let newDomElement = null
        const nextSibling = oldDomElement && oldDomElement.nextSibling

        if (vdom.type === 'text') {
            newDomElement = document.createTextNode(vdom.props.textContent)
        } else {
            newDomElement = document.createElement(vdom.type)
            updateDomElement(newDomElement, vdom)
        }

        // 存储 vdom 方便后续的 diff
        newDomElement._virtualElement = vdom
        // 挂载接点
        if (nextSibling) {
            container.insertBefore(newDomElement, nextSibling)
        } else {
            container.appendChild(newDomElement)
        }

        vdom.children.forEach(child => mountElement(child, newDomElement))
    }
    const render = function render(vdom, container, oldDom = container.firstChild) {
        if (!oldDom) {
            // 第一次挂载
            mountElement(vdom, container, oldDom)
        }
    }

    const updateDomElement = function updateDomElement(domElement, newVirtualElement, oldVirtualElement = {}) {
        const newProps = newVirtualElement.props || {}
        const oldProps = oldVirtualElement.props || {}
        
        Object.keys(newProps).forEach(propName => {
            const newProp = newProps[propName] 
            const oldProp = oldProps[propName]

            if (newProp !== oldProp) {
                if (propName.slice(0, 2) === 'on') {
                    // 是对应的事件
                    const eventName = propName.toLocaleLowerCase().slice(2)
                    domElement.addEventListener(eventName, newProp, false)

                    if (oldProp) {
                        domElement.removeEventListener(eventName, oldProp, false)
                    }
                } else if (propName === 'value' || propName === 'checked') {
                    // 设置特殊的属性  这些不能用 setAttribute 设置
                    oldElement[propName] = newProp
                } else if (propName !== 'children') {

                    if (propName === 'className') {
                        domElement.setAttribute('class', newProps[propName])
                    } else {
                        domElement.setAttribute(propName, newProps[propName])
                    }
                }
            }
        })
        // 去除 多余的属性
        Object.keys(oldProps).forEach(propName => {
            const newProp = newProps[propName] 
            const oldProp = oldProps[propName]
            
            if (!newProp) {
                if (propName.slice(0, 2) === 'on' ) {
                    const eventName = propName.toLocaleLowerCase().slice(2)
                    domElement.removeEventListener(eventName, oldProp)
                } else if (propName !== children){
                    domElement.removeAtrribute(propName)
                }
            }
        })
    }
    return {
        createElement,
        render,
    }
}());