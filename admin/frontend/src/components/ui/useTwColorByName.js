import { useCallback } from 'react'

const whiteListTwColor = [
    '#FF6B6B',
    '#26313B',
    '#1D3557',
    '#F96854',
    '#6D6875',
    '#2E9FFF',
    '#335D6F',
    '#9952FC',
    '#F6BD60',
    '#5C5C00',
    '#B5838D',
    '#98CE1E',
    '#8038A9',
    '#557665',
    '#537BC4',
    '#5A00FF',
    '#0097A7',
    '#AEEA00',
    '#00BCD4',
    '#E91E63',
    '#673AB7',
    '#64DD17',
    '#C21807',
    '#FFC107',
    '#2962FF',
    '#00C853',
    '#D500F9',
    '#FF3D00',
]

function useTwColorByName(prefix = 'bg') {
    const hashName = (name) => {
        let hash = 0
        for (let i = 0; i < name.length; i++) {
            const charCode = name.charCodeAt(i)
            hash += charCode
        }
        return hash
    }

    const generateTwColor = useCallback(
        (name) => {
            const hash = hashName(name)
            const index = hash % whiteListTwColor.length
            const color = whiteListTwColor[index]
            // return `!${prefix}-${color} !dark:${prefix}-${color}`
            return {'bg-color': `${color}`, 'font-color': `white`}
            // return `${color}`
        },
        [prefix]
    )

    return generateTwColor
}

export default useTwColorByName
