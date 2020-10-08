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

    return {
        createElement,
    }
}());