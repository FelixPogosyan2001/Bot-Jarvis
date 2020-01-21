"use strict";
/// <reference path="app-namespace.ts" />
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var App;
(function (App) {
    const SetTime = (Constructor) => {
        return class extends Constructor {
            constructor(name, lastname) {
                super(name, lastname);
                this.visitTime = new Date().getDate();
            }
        };
    };
    let User = class User {
        constructor(name, lastname) {
            this.name = name;
            this.lastname = lastname;
            this.entertainment = [];
            this.city = '';
            this.mood = null;
        }
    };
    User = __decorate([
        SetTime
    ], User);
    let someMood;
    (function (someMood) {
        someMood["Perfect"] = "\u043E\u0442\u043B\u0438\u0447\u043D\u043E\u0435";
        someMood["Bad"] = "\u043F\u043B\u043E\u0445\u043E\u0435";
        someMood["Changeable"] = "\u043F\u0435\u0440\u0435\u043C\u0435\u043D\u0447\u0438\u0432\u043E\u0435";
        someMood["Good"] = "\u0445\u043E\u0440\u043E\u0448\u0435\u0435";
    })(someMood || (someMood = {}));
    //==================================================
    const axios = require('axios');
    const token = require('../additional/setToken');
    const VkBot = require('node-vk-bot-api');
    const Markup = require('node-vk-bot-api/lib/markup');
    const bot = new VkBot(token);
    const db = require('../additional/database');
    let user;
    const getGreeting = (user) => {
        const hour = parseInt(new Date().toLocaleTimeString().slice(0, 2));
        let time = null;
        if (hour >= 18 && hour <= 23) {
            time = 'Добрый вечер';
        }
        else if (hour >= 0 && hour <= 6) {
            time = 'Привет';
        }
        else if (hour >= 7 && hour <= 12) {
            time = 'Доброе утро';
        }
        else if (hour >= 13 && hour <= 17) {
            time = 'Добрый день';
        }
        return time + ',' + user.name;
    };
    const versions = (arg) => {
        let total = '';
        let places = arg.filter((el) => !user.entertainment.includes(el.name || el.description));
        if (!places.length) {
            return '';
        }
        for (let i = 1; i <= 2; i++) {
            let place = places[i - 1];
            if (place.name) {
                user.entertainment.push(place.name);
                total += (`${i}) ${place.name} - ${place.description} \n`);
            }
            else {
                user.entertainment.push(place.description);
                total += (`${i}) ${place.description} \n`);
            }
        }
        return total;
    };
    const getIdeas = () => __awaiter(this, void 0, void 0, function* () {
        const url = `http://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(user.city)}&appid=89cada44c692faad7f77c9d9f88c7feb&units=metric`;
        const { data } = yield axios.get(url);
        const weather = Math.round(data.main.temp);
        if (weather > 10 && user.mood != someMood.Bad) {
            let text = versions(db[user.city].placesW);
            if (!text)
                return 'Извини,но я уже не знаю,что тебе выдать.Обращайся позже';
            return `Вот тебе несколько крутых мест,куда ты можешь сходить и отлично провести время: \n` + text;
        }
        else if (weather < 10 && user.mood != someMood.Bad) {
            let text = versions(db[user.city].placesC);
            if (!text)
                return 'Извини,но я уже не знаю,что тебе выдать.Обращайся позже';
            return `Так как на улице холодно,но настроение ${user.mood},я советую тебе следующие места: \n` + text;
        }
        else {
            return versions(db['entertainment']) || 'Извини,но я уже не знаю,что тебе выдать.Обращайся позже';
        }
    });
    bot.use((ctx, next) => {
        if (ctx.message.type == 'message_new' && ctx.message.body.includes('г.')) {
            user.city = ctx.message.body.replace('г.', '').trim();
            ctx.reply('Какое у вас сегодня настроение ? (отличное,плохое,переменчивое,хорошее)');
        }
        else if (ctx.message.type == 'message_new' && Object.values(someMood).includes(ctx.message.body)) {
            user.mood = ctx.message.body;
            ctx.reply('Такс,сейчас я подумаю,что же тебе такое предложить');
        }
        else if (ctx.message.body.includes('предложить')) {
            getIdeas().then(info => ctx.reply(info, null, Markup.keyboard([
                Markup.button('Получить предложения', 'positive')
            ])));
        }
        else {
            next();
        }
    });
    bot.command('Начать', (ctx) => __awaiter(this, void 0, void 0, function* () {
        if (user) {
            ctx.reply('Ты уже начал диалог со мной.');
            return false;
        }
        const { first_name, last_name } = (yield bot.execute('users.get', { user_ids: ctx.message.user_id }))[0];
        user = new User(first_name, last_name);
        const text = `${getGreeting(user)}.Я помогу тебе определиться с тем,как провести свободное время незабываемо круто.
    Единственное,что от тебя будет нужно - это ответить на пару вопросов.Готовы к вопросам ? `;
        ctx.reply(text.trim(), null, Markup.keyboard([
            Markup.button('Да', 'primary'),
            Markup.button('Нет', 'negative')
        ], { columns: 2 }));
    }));
    bot.command('Да', (ctx) => {
        ctx.reply('Из какого вы города ?(Ответье начиная с "г. Ответ")', null, Markup.keyboard([]));
    });
    bot.command('Нет', (ctx) => {
        ctx.reply('Тогда я не смогу тебе посоветовать', null, Markup.keyboard([]));
    });
    bot.command('Получить предложения', (ctx) => {
        if (user.visitTime == new Date().getDate()) {
            ctx.reply('На сегодня ты уже получил несколько вариантов,как можно провести время.');
        }
        else {
            ctx.reply(`${getGreeting(user)}.Я ценю,что ты обращаешься ко мне за советом.
            И чтобы снова тебе помочь с выбором,мне нужно знать какое у тебя сегодня настроение?(отличное,плохое,переменчивое,хорошее)`);
        }
    });
    bot.on((ctx) => {
        ctx.reply('К сожалению,я не понимаю вас');
    });
    bot.startPolling(() => console.log('Bot started'));
})(App || (App = {}));
