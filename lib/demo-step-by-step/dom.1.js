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

    return {
        createElement,
        render,
    }
}());