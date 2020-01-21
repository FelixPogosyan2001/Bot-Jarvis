namespace App {
    export interface Bot {
        constructor: any,
        execute: Function,
        use: Function,
        command:Function,
        event: Function,
        on: Function,
        sendMessage:Function,
        startPolling: Function,
        webhookCallback: Function
    }

    export interface Mark {
        keyboard<T,R extends object>(buttons: T[],options?: R): Function 
        button<T extends object>(label: string | any ,color: btnColor ,payload?: T): Function
        onTime?: Function
    }

    export interface Person {
        name: string
        lastname: string
        city: string
        mood: string | null
        entertainment: string[]
        visitTime?: number | null
    }

    export enum someMood {
        Perfect = 'отличное',
        Bad = 'плохое',
        Changeable = 'переменчивое',
        Good = 'хорошее'
    }

    type btnColor = 'primary' | 'positive' | 'negative'
}