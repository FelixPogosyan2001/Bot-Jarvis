/// <reference path="app-namespace.ts" />

namespace App {
    const SetTime = (Constructor: any): any => {
        return class extends Constructor {
            constructor(name: string,lastname: string){
                super(name,lastname)
                this.visitTime = new Date().getDate()
            }
        }
    }
 
    @SetTime
    class User implements Person {
        entertainment = []
        city = ''
        mood = null
        constructor(public name: string,public lastname: string) {}
    }

    enum someMood {
        Perfect = 'отличное',
        Bad = 'плохое',
        Changeable = 'переменчивое',
        Good = 'хорошее'
    }

    //==================================================
    const axios: any = require('axios')
    const token: string = require('../additional/setToken')
    const VkBot: any = require('node-vk-bot-api')
    const Markup: Mark = require('node-vk-bot-api/lib/markup')
    const bot: Bot = new VkBot(token)
    const db = require('../additional/database')
    let user: Person

    const getGreeting = <U extends Person>(user: U): string | null => {
        const hour: number = parseInt(new Date().toLocaleTimeString().slice(0,2))
        let time: string | null = null;

        if (hour >= 18 && hour <= 23) {
          time = 'Добрый вечер'
        } else if (hour >=0 && hour <= 6 ) {
            time = 'Привет'
        } else if (hour >=7 && hour <=12 ) {
            time = 'Доброе утро'
        } else if (hour >= 13 && hour <= 17) {
            time = 'Добрый день'
        }

        return time + ',' + user.name
    }

    const versions = (arg: any): string => {
        let total: string = ''
        let places = arg.filter((el: {name?: string,description: string}) => !user.entertainment.includes(el.name || el.description))

        if (!places.length) {
            return ''
        }

        for (let i = 1;i <= 2;i++){
            let place = places[i-1]
            if (place.name) {
                user.entertainment.push(place.name)
                total += (`${i}) ${place.name} - ${place.description} \n`)
            } else {
                user.entertainment.push(place.description)
                total += (`${i}) ${place.description} \n`)
            }
        }

        return total
    }

    const getIdeas = async (): Promise<string> => {
        const url: string =  `http://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(user.city)}&appid=89cada44c692faad7f77c9d9f88c7feb&units=metric`
        const {data}: any = await axios.get(url)
        const weather: number = Math.round(data.main.temp) 

        if (weather > 10 && user.mood != someMood.Bad) {
            let text: string = versions(db[user.city].placesW)
            if (!text) return 'Извини,но я уже не знаю,что тебе выдать.Обращайся позже'
            return `Вот тебе несколько крутых мест,куда ты можешь сходить и отлично провести время: \n` + text
        } else if (weather < 10 && user.mood != someMood.Bad) {
            let text: string = versions(db[user.city].placesC)
            if (!text) return 'Извини,но я уже не знаю,что тебе выдать.Обращайся позже'
            return `Так как на улице холодно,но настроение ${user.mood},я советую тебе следующие места: \n` +  text
        } else {
            return versions(db['entertainment']) || 'Извини,но я уже не знаю,что тебе выдать.Обращайся позже'
        }

    }

    bot.use((ctx: any,next: Function) => {
        if (ctx.message.type == 'message_new' && ctx.message.body.includes('г.')) {
            user.city = ctx.message.body.replace('г.','').trim()
            ctx.reply('Какое у вас сегодня настроение ? (отличное,плохое,переменчивое,хорошее)')
        } else if (ctx.message.type == 'message_new' && Object.values(someMood).includes(ctx.message.body)) {
            user.mood = ctx.message.body
            ctx.reply('Такс,сейчас я подумаю,что же тебе такое предложить')
        } else if (ctx.message.body.includes('предложить')) {
            getIdeas().then(info => ctx.reply(info,null,Markup.keyboard([
                Markup.button('Получить предложения','positive')
            ])))
        } else {
            next()
        }
    })

    bot.command('Начать', async (ctx: any) => {
        if (user) {
            ctx.reply('Ты уже начал диалог со мной.')
            return false
        }
        const {first_name,last_name} = (await bot.execute('users.get',{user_ids: ctx.message.user_id}))[0]
        user = new User(first_name,last_name) 
        const text = `${getGreeting(user)}.Я помогу тебе определиться с тем,как провести свободное время незабываемо круто.
    Единственное,что от тебя будет нужно - это ответить на пару вопросов.Готовы к вопросам ? `

        ctx.reply(text.trim(),null,Markup.keyboard([
            Markup.button('Да','primary'),
            Markup.button('Нет','negative')
        ],{columns: 2}))
    })

    bot.command('Да',(ctx: any): void => {
        ctx.reply('Из какого вы города ?(Ответье начиная с "г. Ответ")',null,Markup.keyboard([]))
    })

    bot.command('Нет',(ctx: any): void => {
        ctx.reply('Тогда я не смогу тебе посоветовать',null,Markup.keyboard([]))
    })

    bot.command('Получить предложения',(ctx: any): void => {
        if (user.visitTime == new Date().getDate()) {
            ctx.reply('На сегодня ты уже получил несколько вариантов,как можно провести время.')
        } else {
            ctx.reply(`${getGreeting(user)}.Я ценю,что ты обращаешься ко мне за советом.
            И чтобы снова тебе помочь с выбором,мне нужно знать какое у тебя сегодня настроение?(отличное,плохое,переменчивое,хорошее)`)
        }
    })
    
    bot.on((ctx: any) => {
        ctx.reply('К сожалению,я не понимаю вас')
    })

    bot.startPolling(() => console.log('Bot started'))
}