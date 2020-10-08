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
        if (isFunction(vdom)) {
            return mountComponent(vdom, container, oldDom)
        } else {
            // 映射原生
            return mountSimpleNode(vdom, container, oldDom)
        }
        
    }

    function isFunction(obj) {
        return obj && 'function' === typeof obj.type
    }

    function isFunctionalComponent(vnode) {
        let nodeType = vnode && vnode.type
        return nodeType && isFunction(vnode) && !(nodeType.prototype && nodeType.prototype.render)
    }
    function buildFunctionComponent(vnode, context) {
        return vnode.type(vnode.props || {})
    }
    function buildStatefulComponent(virtualElement) {
        const component  = new virtualElement.type(virtualElement.props)

        const nextElement = component.render()
        // for diff
        nextElement.component = component

        return nextElement
    }
    function mountComponent(vdom, container, oldDomElement) {
        let nextvDom = null, component = null, newDomElement = null;

        if (isFunctionalComponent(vdom)) {
            nextvDom = buildFunctionComponent(vdom)
        } else {
            nextvDom = buildStatefulComponent(vdom)
            component = nextvDom.component
        }

        if (isFunction(nextvDom)) {
            return mountElement(newvDom, container, oldDomElement)
        } else {
            newDomElement = mountElement(nextvDom, container, oldDomElement)
        }

        if (component) {
            component.componentDidMount()
            if (component.props.ref) {
                component.props.ref(component)
            }
        }
        return newDomElement
    }

    const mountSimpleNode = function mountSimpleNode(vdom, container, oldDomElement, parentComponent) {
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
        // 去除 老节点
        if (oldDomElement) {
            unmountNode(oldDomElement, parentComponent)
        }
        // 挂载接点
        if (nextSibling) {
            container.insertBefore(newDomElement, nextSibling)
        } else {
            container.appendChild(newDomElement)
        }

        let component = vdom.component 
        if (component) {
            component.setDomElement(newDomElement)
        }
        
        vdom.children.forEach(child => mountElement(child, newDomElement))

        if (vdom.props && vdom.props.ref) {
            vdom.props.ref(newDomElement)
        }
    }
    const render = function render(vdom, container, oldDom = container.firstChild) {
      diff(vdom, container, oldDom)
    }  
    const diff = function diff(vdom, container, oldDom) {
        let oldvdom = oldDom && oldDom._virtualElement
        let oldComponent = oldvdom && oldvdom.component
        if (!oldDom) {
            // 第一次挂载
            mountElement(vdom, container, oldDom)
        } 
        else if ((vdom.type !== oldvdom.type) && (typeof vdom.type !== 'function')) {
             let newDomElement = createDomElement(vdom)

             oldDom.parentNode.replaceChild(newDomElement, oldDom)
        }
        else if (typeof vdom.type === 'function') {
            diffComponent(vdom, oldComponent, container, oldDom)
        }
        else if (oldvdom && oldvdom.type === vdom.type) {
            if (oldvdom.type === 'text') {
                updateTextNode(oldDom, vdom, oldvdom)
            } else {
                updateDomElement(oldDom, vdom, oldvdom)
            }

            oldDom._virtualElement = vdom

            // key 元素集合

            let keyedElements = {}
            for (let i = 0; i < oldDom.childNodes.length; i += 1) {
                const domElement = oldDom.childNodes[i]
                const key = domElement._virtualElement.props.key

                if (key) {
                    keyedElements[key] = {
                        domElement,
                        index: i,
                    }
                }
            }
            // children 递归 diff
            if (Object.keys(keyedElements).length === 0) {
                // 通过 index
                vdom.children.forEach((child, i) => {
                    diff(child, oldDom, oldDom.childNodes[i])
                })
            } else {
                // 通过 key
                vdom.children.forEach((virtualElement, i) => {
                    const key = virtualElement.props.key
                    if (key) {
                        const keyedDomElement = keyedElements[key]

                        if (keyedDomElement) {
                            // 元素放置正确位置
                            if(oldDom.childNodes[i] &&  !oldDom.childNodes[i].isSameNode(keyedDomElement.domElement)) {
                                oldDom.insertBefore(keyedDomElement.domElement, oldDom.childNodes[i])
                            }
                            diff(virtualElement, oldDom, keyedDomElement.domElement)
                        }
                        else {
                            mountElement(virtualElement, oldDom)
                        }
                    } 
                })
            }
            

            // 删除多余老节点
            let oldNodes = oldDom.childNodes

            if (Object.keys(keyedElements).length === 0) {
                if (oldNodes.length > vdom.children.length) {
                    for (let i = oldNodes.length - 1; i >= vdom.children.length ; i -= 1) {
                        let nodeToBeRemove = oldNodes[i]
                        unmountNode(nodeToBeRemove, oldDom)
                    }
                }
            } else {
                if (oldNodes.length > vdom.children.length) {
                    for (let i = 0; i <oldDom.childNodes.length; i+= 1) {
                        let oldChild = oldDom.childNodes[i]
                        let oldKey = oldChild.getAttribute('key')

                        let found = false
                        for(let n = 0; n < vdom.children.length; n+= 1) {
                            if (vdom.children[n].props.key === oldKey) {
                                found = true
                                break
                            }
                        }

                        if (!found) {
                            unmountNode(oldChild, oldDom)
                        }
                    }
                }
            } 
        }
    }
    function createDomElement(vdom) {
        let newDomElement = null
        if (vdom.type === 'text') {
            newDomElement = document.createTextNode(vdom.props.textContent)
        } else {
            newDomElement = document.createElement(vdom.type)
            updateDomElement(newDomElement, vdom)
        }

        newDomElement._virtualElement = vdom
        vdom.children.forEach(child => {
            newDomElement.appendChild(createDomElement(child))
        })

        if (vdom.props && vdom.props.ref) {
            vdom.props.ref(newDomElement)
        }

        return newDomElement
    }
    function diffComponent (newVirtualElement, oldComponent, container, domElement) {
        if (isSameComponentType(oldComponent, newVirtualElement)) {
            updateComponent(newVirtualElement, oldComponent, container, domElement)
        } else {
            mountElement(newVirtualElement, container, domElement)
        }
    }
    function updateComponent(newVirtualElement, oldComponent, container, domElement) {
        oldComponent.componentWillReceiveProps(newVirtualElement.props)

        if (oldComponent.shouldComponentUpdate(newVirtualElement.props)) {
            const prevProps = oldComponent.props

            oldComponent.componentWillUpdate(
                newVirtualElement.props,
                oldComponent.state
            )
            
            oldComponent.updateProps(newVirtualElement.props)
            // new vdom
            const nextElement = oldComponent.render()
            nextElement.component = oldComponent

            // 递归 diff
            diff(nextElement, container, domElement, oldComponent)

            oldComponent.componentDidUpdate(prevProps)
        }
    }
    function isSameComponentType(oldComponent, newVirtualElement) {
        return oldComponent && newVirtualElement.type === oldComponent.type
    }

    function unmountNode(domElement, parentComponent) {
        const virtualElement = domElement._virtualElement
        if (!virtualElement) {
            domElement.remove()
            return
        }
        // if component exist
        let oldComponent = domElement._virtualElement.component
        if (oldComponent) {
            oldComponent.componentWillUnmount()
        }
        // 递归 卸载 
        while(domElement.childNodes.length > 0) {
            unmountNode(domElement.firstChild)
        }

        if (virtualElement.props && virtualElement.props.ref) {
            virtualElement.props.ref(null)
        }

        Object.keys(virtualElement.props).forEach(propsName => {
            if (propsName.slice(0, 2) === 'on') {
                const event  = propsName.toLowerCase().slice(2) 
                const handle = virtualElement.props[propsName] 

                domElement.removeEventListener(event, handle)
            }
        })

        domElement.remove()
        
    }
    function updateTextNode (domElement, newVirtualElement, oldVirtualElement) {
        if (newVirtualElement.props.textContent !== oldVirtualElement.props.textContent) {
            domElement.textContent = newVirtualElement.props.textContent
        }
        // 设置新新的 dom
        domElement._virtualElement = newVirtualElement
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
                    domElement[propName] = newProp
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

    class Component {
        constructor(props) {
            this.props = props
            this.state = {}
            this.prevState = {}
        }

        setState (nextState) {
            if (!this.prevState) this.prevState = this.state

            this.state = Object.assign({}, this.state, nextState)

            let dom = this.getDomElement()

            let container = dom.parentNode

            let newvdom = this.render()

            // 递归 diff
            diff(newvdom, container, dom)
        }
        // helper
        setDomElement(dom) {
            this._dom = dom
        }

        getDomElement() {
            return this._dom
        }
        updateProps(props) {
            this.props = props
        }

        componentWillMount() {

        }

        componentDidMount() {

        }

        componentWillReceiveProps(nextProps) {

        }

        shouldComponentUpdate(nextProps, nextState) {
            return nextProps != this.props || nextState != this.state
        }

        componentWillUpdate(nextProps, nextState) {}
        componentDidUpdate(nextProps, nextState) {}

        componentWillUnmount() {}
    }
    return {
        createElement,
        render,
        Component,
    }
}());