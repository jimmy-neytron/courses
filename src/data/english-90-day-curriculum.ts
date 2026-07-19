import type { CorrectionItem, Flashcard } from '@/types/course'

export interface CourseQuestion {
  question: string
  options: string[]
  correct: number
  explanation: string
}

interface TopicPack {
  id: string
  stage: string
  level: string
  title: string
  range: readonly [number, number]
  theory: string
  formula: string
  listeningIntro: string
  vocabulary: Array<[string, string]>
  errors: CorrectionItem[]
  questions: CourseQuestion[]
}

interface DayPlan {
  day: number
  title: string
  task: string
  source: string
  answer: string
}

export interface English90Day {
  day: number
  stage: string
  level: string
  title: string
  goal: string
  task: string
  theory: string
  formula: string
  conversation: string
  transcript: string
  vocabulary: Array<[string, string, string]>
  errors: CorrectionItem[]
  translation: { source: string; answer: string }
  questions: CourseQuestion[]
  exam?: number
}

const q = (question: string, options: string[], correct: number, explanation: string): CourseQuestion => ({
  question,
  options,
  correct,
  explanation,
})

const e = (incorrect: string, correct: string, explanation: string): CorrectionItem => ({
  incorrect,
  correct,
  explanation,
})

const vocabulary = (raw: string): Array<[string, string]> => raw.split(';').map((pair) => {
  const [front, back] = pair.split('|')
  return [front!, back!]
})

const topicPacks: TopicPack[] = [
  {
    id: 'foundation', stage: 'Этап 1 · Закладываем основу', level: 'A0 → A1', title: 'Диагностика и простая разговорная речь', range: [1, 7],
    theory: 'Базовое английское предложение строится в порядке Subject + Verb + Object: сначала называем действующее лицо, затем действие и дополнение. С именем, профессией, местом и состоянием нужен глагол be: I am, you/we/they are, he/she/it is. Личные местоимения заменяют человека или предмет, притяжательные показывают принадлежность: my, your, his, her, our, their. Present Simple описывает привычки и факты. В вопросах с обычным глаголом используем do/does, в отрицаниях — do not/does not. Наречия частотности ставятся перед смысловым глаголом, но после be.',
    formula: 'Subject + verb + object. I am… / She is… / Do you work? / He does not work. I usually study, but I am never late.',
    listeningIntro: 'Hi, I am Alex. I live near the city center and work from home. I usually start at nine, take a short walk after lunch and study English in the evening.',
    vocabulary: vocabulary('introduce myself|представиться;be interested in|интересоваться;work from home|работать из дома;live nearby|жить поблизости;in my free time|в свободное время;get along with|ладить с;be responsible for|отвечать за;start work at|начинать работу в;finish early|заканчивать рано;spend time with|проводить время с;have a lot in common|иметь много общего;once a week|раз в неделю;hardly ever|почти никогда;most of the time|большую часть времени;be good at|хорошо уметь;find it difficult to|считать что-либо сложным;look forward to|ждать с нетерпением;keep in touch|поддерживать связь;have a busy schedule|иметь плотное расписание;make time for|находить время для'),
    errors: [e('I from Moscow.', 'I am from Moscow.', 'С местом происхождения нужен be.'), e('She work online.', 'She works online.', 'В Present Simple с she добавляем -s.'), e('Where you live?', 'Where do you live?', 'С обычным глаголом вопрос строится через do.'), e('He do not study.', 'He does not study.', 'С he используется does.'), e('I am usually work at home.', 'I usually work at home.', 'Перед обычным глаголом be не нужен.'), e('My sister name is Kate.', "My sister's name is Kate.", 'Принадлежность выражается притяжательной формой.')],
    questions: [q('Choose the correct introduction.', ['I am Daria.', 'I Daria.', 'I is Daria.'], 0, 'С именем используем I am.'), q('She ___ in a bank.', ['work', 'works', 'working'], 1, 'С she в Present Simple добавляем -s.'), q('___ you live nearby?', ['Are', 'Do', 'Does'], 1, 'С обычным глаголом live нужен do.'), q('Correct frequency position:', ['I go usually there.', 'I usually go there.', 'Usually I am go there.'], 1, 'Наречие ставится перед смысловым глаголом.'), q('This is Anna. ___ job is interesting.', ['His', 'Her', 'Their'], 1, 'Для Anna используем her.'), q('Correct negative:', ['He does not work.', 'He does not works.', 'He not work.'], 0, 'После does not используется инфинитив.')],
  },
  {
    id: 'present', stage: 'Этап 1 · Закладываем основу', level: 'A1', title: 'Настоящее время', range: [8, 14],
    theory: 'Present Simple нужен для регулярных действий, фактов и расписаний; Present Continuous — для действия прямо сейчас, временной ситуации или изменения. Continuous строится как am/is/are + verb-ing. Слова usually, every day и often часто указывают на Simple; now, at the moment и today — на Continuous. Глаголы состояния know, like, want, need, believe и understand обычно не употребляются в Continuous. Окончание -s произносится /s/, /z/ или /ɪz/, а при добавлении -ing иногда убирается конечная e или удваивается согласная.',
    formula: 'I work every day. I am working now. She knows the answer. Are they waiting? He is staying with friends this week.',
    listeningIntro: 'On weekdays Maya works in an office, but today she is working from a café. She is waiting for a client and checking her notes while people are talking around her.',
    vocabulary: vocabulary('at the moment|в данный момент;on a regular basis|регулярно;these days|в эти дни;right now|прямо сейчас;work on a project|работать над проектом;deal with a problem|разбираться с проблемой;wait for someone|ждать кого-либо;stay with friends|жить у друзей временно;change quickly|быстро меняться;depend on|зависеть от;believe in|верить в;make progress|добиваться прогресса;pay attention to|обращать внимание на;take notes|делать заметки;check the details|проверять детали;follow a routine|следовать распорядку;break a habit|избавляться от привычки;improve gradually|улучшаться постепенно;pronounce clearly|произносить ясно;notice the difference|замечать разницу'),
    errors: [e('I working now.', 'I am working now.', 'В Continuous обязательна форма be.'), e('She is know the answer.', 'She knows the answer.', 'Know — глагол состояния.'), e('He usually is working late.', 'He usually works late.', 'Регулярное действие требует Present Simple.'), e('They are wait outside.', 'They are waiting outside.', 'После be нужна форма -ing.'), e('Does she working today?', 'Is she working today?', 'Вопрос Continuous начинается с is.'), e('He studyes every day.', 'He studies every day.', 'После согласной + y используем -ies.')],
    questions: [q('Look! It ___.', ['rains', 'is raining', 'rain'], 1, 'Действие происходит сейчас.'), q('I ___ what you mean.', ['am understanding', 'understand', 'understanding'], 1, 'Understand — глагол состояния.'), q('She usually ___ at eight.', ['starts', 'is starting', 'start'], 0, 'Usually указывает на привычку.'), q('We ___ with friends this week.', ['stay', 'are staying', 'stays'], 1, 'Временная ситуация требует Continuous.'), q('Correct question:', ['Are you waiting?', 'Do you waiting?', 'You are waiting?'], 0, 'Be ставится перед подлежащим.'), q('Correct spelling:', ['makeing', 'making', 'makking'], 1, 'Перед -ing конечная e убирается.')],
  },
  {
    id: 'past', stage: 'Этап 1 · Закладываем основу', level: 'A1 → A2', title: 'Прошедшее время', range: [15, 21],
    theory: 'Past Simple описывает завершённое действие в конкретный момент прошлого. Правильные глаголы получают -ed, неправильные имеют отдельную форму V2: go–went, see–saw, take–took. Формы be в прошлом — was и were. В вопросах и отрицаниях используем did/did not + инфинитив, поэтому после did форма V2 недопустима. Временные маркеры yesterday, last week, two days ago и in 2024 помогают обозначить завершённый период. Для связного рассказа используйте first, then, after that, suddenly и finally.',
    formula: 'I worked / went yesterday. Did you go? I did not see it. She was tired. First…, then…, after that…, finally…',
    listeningIntro: 'Last Saturday we drove to the coast, found a quiet beach and had lunch in a small café. It started to rain, so we took a bus home earlier than planned.',
    vocabulary: vocabulary('wake up late|поздно проснуться;miss the bus|опоздать на автобус;get home|добраться домой;have a great time|отлично провести время;take place|происходить;all of a sudden|внезапно;at first|сначала;after a while|через некоторое время;in the end|в итоге;make a mistake|совершить ошибку;tell a story|рассказать историю;remember clearly|ясно помнить;forget about|забыть о;run into someone|случайно встретить;find out|выяснить;grow up|вырасти;move to another city|переехать в другой город;spend the weekend|провести выходные;go on a trip|отправиться в поездку;change my mind|передумать'),
    errors: [e('Did you went?', 'Did you go?', 'После did нужен инфинитив.'), e('I buyed it.', 'I bought it.', 'Buy — неправильный глагол.'), e('They was tired.', 'They were tired.', 'С they используется were.'), e('She did not saw him.', 'She did not see him.', 'После did not нужна первая форма.'), e('We goed home.', 'We went home.', 'Go–went–gone.'), e('It happen yesterday.', 'It happened yesterday.', 'Завершённое действие требует Past Simple.')],
    questions: [q('Past of go:', ['goed', 'went', 'gone'], 1, 'Go–went–gone.'), q('Did she ___ you?', ['called', 'call', 'calls'], 1, 'После did — инфинитив.'), q('They ___ at home yesterday.', ['was', 'were', 'are'], 1, 'Прошедшая форма be для they — were.'), q('Correct negative:', ['I did not see it.', 'I did not saw it.', 'I not saw it.'], 0, 'Did not + infinitive.'), q('Two days ___:', ['last', 'ago', 'yesterday'], 1, 'Ago ставится после периода.'), q('Best story connector for the last event:', ['First', 'Usually', 'Finally'], 2, 'Finally вводит финальное событие.')],
  },
  {
    id: 'future', stage: 'Этап 1 · Закладываем основу', level: 'A2', title: 'Будущее и планы', range: [22, 30],
    theory: 'Для будущего выбираем форму по смыслу. Be going to выражает заранее принятое намерение и прогноз по видимым признакам. Present Continuous используется для договорённости с конкретным временем или участниками. Will подходит для спонтанного решения, обещания и нейтрального прогноза. После want, plan, hope и would like используется to + infinitive. Чтобы договориться, уточняйте время и место, предлагайте альтернативу и подтверждайте итог: Are you free on…? How about…? That works for me.',
    formula: "I am going to study. We are meeting at six. I think it will rain. I will help you. I would like to join.",
    listeningIntro: 'Nora is meeting Sam on Saturday at eleven. They are going to visit a new exhibition, and afterward they might have lunch. Sam has not booked a table yet, so he will do it now.',
    vocabulary: vocabulary('make plans|строить планы;arrange a meeting|договориться о встрече;be available|быть свободным;look ahead|думать о будущем;set a goal|поставить цель;take the next step|сделать следующий шаг;change careers|сменить профессию;learn a new skill|освоить новый навык;keep a promise|сдержать обещание;make a prediction|сделать прогноз;book a table|забронировать столик;send an invitation|отправить приглашение;confirm the time|подтвердить время;suggest an alternative|предложить альтернативу;that works for me|мне подходит;I am afraid I cannot|боюсь что не смогу;by the end of the year|к концу года;in the near future|в ближайшем будущем;five years from now|через пять лет;achieve a goal|достичь цели'),
    errors: [e('I will to call you.', 'I will call you.', 'После will нет to.'), e('I am go to travel.', 'I am going to travel.', 'Нужна полная конструкция be going to.'), e('We meet tomorrow at six.', 'We are meeting tomorrow at six.', 'Договорённость выражается Present Continuous.'), e('I plan learning more.', 'I plan to learn more.', 'После plan используем to + infinitive.'), e('It going to rain.', 'It is going to rain.', 'В конструкции нужен be.'), e('I call you later, I promise.', 'I will call you later, I promise.', 'Обещание выражается через will.')],
    questions: [q('A spontaneous decision:', ['I will help you.', 'I am going help you.', 'I helping you.'], 0, 'Will подходит для решения в момент речи.'), q('A fixed arrangement:', ['We meet maybe.', 'We are meeting at six.', 'We will meeting at six.'], 1, 'Present Continuous + конкретное время.'), q('Look at those clouds! It ___.', ['is going to rain', 'rains tomorrow', 'will raining'], 0, 'Есть видимый признак.'), q('After hope:', ['hope to travel', 'hope travelling always', 'hope travel to'], 0, 'Hope + to + infinitive.'), q('Correct invitation phrase:', ['Are you free on Friday?', 'Do you free Friday?', 'Are you freely Friday?'], 0, 'Be free — устойчивая модель.'), q('Correct promise:', ['I call you.', 'I will call you.', 'I will to call you.'], 1, 'Will + infinitive.')],
  },
  {
    id: 'modals', stage: 'Этап 2 · Развиваем свободную речь', level: 'A2', title: 'Модальные глаголы', range: [31, 37],
    theory: 'Модальные глаголы показывают способность, совет, обязанность, запрет и вероятность. После can, could, should, must, may и might используется инфинитив без to. Can описывает способность сейчас, could — в прошлом или вежливую просьбу. Should даёт рекомендацию. Must выражает сильную обязанность говорящего, have to — внешнее правило. Must not означает запрет, а do not have to — отсутствие необходимости. May и might показывают вероятность. В просьбах смягчайте формулировку: Could you…? Would you mind + verb-ing?',
    formula: 'I can swim. You should rest. We must leave. I have to work. You must not enter. You do not have to come. It might rain.',
    listeningIntro: 'If you want to improve your English, you should practise a little every day. You do not have to study for hours, but you must use the language actively and you should review your mistakes.',
    vocabulary: vocabulary('be able to|быть способным;ask for help|попросить о помощи;give advice|дать совет;follow the rules|соблюдать правила;be allowed to|иметь разрешение;be required to|быть обязанным;take responsibility|брать ответственность;make an effort|прилагать усилие;avoid distractions|избегать отвлекающих факторов;get enough sleep|достаточно спать;deal with stress|справляться со стрессом;improve a skill|улучшить навык;make a request|сформулировать просьбу;would you mind|не могли бы вы;there is no need to|нет необходимости;it might be useful|это может быть полезно;strongly recommend|настоятельно рекомендовать;set clear rules|установить ясные правила;change a habit|изменить привычку;stay consistent|сохранять регулярность'),
    errors: [e('I can to swim.', 'I can swim.', 'После can нет to.'), e('You should to rest.', 'You should rest.', 'После should — инфинитив без to.'), e("You mustn't come early.", "You don't have to come early.", 'Отсутствие необходимости — do not have to.'), e('He musts work.', 'He must work.', 'Модальные глаголы не получают -s.'), e('Could you to help?', 'Could you help?', 'После could используется инфинитив.'), e('Would you mind to repeat?', 'Would you mind repeating?', 'После would you mind нужна форма -ing.')],
    questions: [q('No necessity:', ['You must not come.', 'You do not have to come.', 'You cannot come.'], 1, 'Do not have to означает «необязательно».'), q('Correct advice:', ['You should rest.', 'You should to rest.', 'You should resting.'], 0, 'Should + infinitive.'), q('A polite request:', ['Could you help me?', 'Do you can help?', 'Could you to help?'], 0, 'Could you + infinitive.'), q('Possibility:', ['It might rain.', 'It must to rain.', 'It might rains.'], 0, 'Might + infinitive.'), q('A prohibition:', ['You must not enter.', 'You do not have to enter.', 'You may enter.'], 0, 'Must not означает запрет.'), q('Past ability:', ['I could swim at five.', 'I can swam at five.', 'I could to swim at five.'], 0, 'Could описывает общую способность в прошлом.')],
  },
  {
    id: 'comparisons', stage: 'Этап 2 · Развиваем свободную речь', level: 'A2 → B1', title: 'Сравнения и точное описание', range: [38, 44],
    theory: 'Короткие прилагательные обычно получают -er/-est, длинные используют more/most. Есть неправильные формы good–better–best и bad–worse–worst. Than вводит второй объект сравнения. As…as показывает равенство, not as…as — различие. Too означает чрезмерность и часто негативный результат; adjective + enough — достаточную степень. Much, far и a lot усиливают сравнительную форму, slightly показывает небольшое отличие. Хорошее сравнение содержит критерий, доказательство и оговорку, а не только слова good и bad.',
    formula: 'This city is bigger than mine. It is the most convenient option. A is as useful as B. It is too expensive but fast enough.',
    listeningIntro: 'The smaller apartment is cheaper and closer to work, while the larger one is much brighter. It is not as convenient for commuting, but it is quiet enough for working from home.',
    vocabulary: vocabulary('much more convenient|намного удобнее;slightly cheaper|немного дешевле;far more reliable|гораздо надёжнее;not as useful as|не такой полезный как;good value for money|хорошее соотношение цены и качества;easy to use|простой в использовании;worth the effort|стоящий усилий;meet my needs|соответствовать потребностям;have an advantage|иметь преимущество;have a drawback|иметь недостаток;make a comparison|провести сравнение;judge by|судить по;take into account|принимать во внимание;on the other hand|с другой стороны;in terms of|с точки зрения;by far the best|безусловно лучший;too expensive to|слишком дорогой чтобы;quiet enough to|достаточно тихий чтобы;thought-provoking|заставляющий задуматься;disappointing result|разочаровывающий результат'),
    errors: [e('more easier', 'easier', 'Не используем двойную сравнительную форму.'), e('the most cheapest', 'the cheapest', 'Cheapest уже содержит превосходную степень.'), e('as better as', 'as good as', 'В конструкции as…as нужна базовая форма.'), e('too much expensive', 'too expensive', 'Перед прилагательным используется too без much.'), e('enough comfortable', 'comfortable enough', 'Enough ставится после прилагательного.'), e('This is more good.', 'This is better.', 'Good имеет неправильную форму better.')],
    questions: [q('Correct comparison:', ['more easier', 'easier', 'more easyer'], 1, 'Easy → easier.'), q('Superlative of good:', ['goodest', 'most good', 'best'], 2, 'Good–better–best.'), q('Correct equality:', ['as useful as', 'as more useful as', 'so useful than'], 0, 'As + adjective + as.'), q('Correct position:', ['enough quiet', 'quiet enough', 'quietly enough place'], 1, 'Enough следует за прилагательным.'), q('A small difference:', ['far cheaper', 'slightly cheaper', 'the cheapest'], 1, 'Slightly означает небольшую степень.'), q('Correct phrase:', ['too expensive to buy', 'too much expensive buy', 'enough expensive to buy'], 0, 'Too + adjective + to + verb.')],
  },
  {
    id: 'perfect', stage: 'Этап 2 · Развиваем свободную речь', level: 'B1', title: 'Present Perfect и жизненный опыт', range: [45, 51],
    theory: 'Present Perfect связывает прошлое с настоящим и строится как have/has + V3. Он описывает опыт без конкретной даты, недавний результат и ситуацию, продолжающуюся до настоящего. Ever и never относятся к опыту, just — к совсем недавнему действию, already — к уже выполненному, yet — к вопросу или отрицанию. For обозначает длительность, since — начальную точку. Если назван завершённый момент yesterday, in 2023 или last week, нужен Past Simple. Сравнивайте: I visited London in 2023 и I have visited London twice.',
    formula: 'I have finished. She has never tried it. Have you ever…? I have lived here for five years / since 2021.',
    listeningIntro: 'I have changed careers twice and have worked in education since 2022. I started learning design last year, and I have already completed three practical projects.',
    vocabulary: vocabulary('gain experience|получить опыт;achieve something|чего-либо достичь;change careers|сменить профессию;take part in|принять участие в;learn from mistakes|учиться на ошибках;overcome a challenge|преодолеть трудность;make progress|добиться прогресса;so far|к настоящему моменту;up to now|до настоящего времени;for several years|несколько лет;since I was a child|с детства;have never tried|никогда не пробовать;have already finished|уже закончить;have not decided yet|ещё не решить;the best I have seen|лучшее что я видел;recently started|недавно начать;work on myself|работать над собой;be proud of|гордиться;valuable lesson|ценный урок;life-changing experience|опыт изменивший жизнь'),
    errors: [e('I have seen him yesterday.', 'I saw him yesterday.', 'С завершённым временем нужен Past Simple.'), e('She has went home.', 'She has gone home.', 'После has нужна V3.'), e('I live here since 2020.', 'I have lived here since 2020.', 'Период до настоящего требует Present Perfect.'), e('Did you ever visit Rome?', 'Have you ever visited Rome?', 'Опыт без даты — Present Perfect.'), e('I have finished it last week.', 'I finished it last week.', 'Last week — завершённый период.'), e('He have already called.', 'He has already called.', 'С he используется has.')],
    questions: [q('Experience without a date:', ['I visited Rome in 2022.', 'I have visited Rome twice.', 'I visit Rome twice.'], 1, 'Present Perfect описывает опыт.'), q('After have:', ['went', 'gone', 'go'], 1, 'Нужна третья форма.'), q('A starting point:', ['for 2020', 'since 2020', 'during 2020 years'], 1, 'Since обозначает начальную точку.'), q('A duration:', ['for three years', 'since three years', 'ago three years'], 0, 'For обозначает продолжительность.'), q('Correct with yesterday:', ['I have called yesterday.', 'I called yesterday.', 'I have call yesterday.'], 1, 'Yesterday требует Past Simple.'), q('Correct question:', ['Have you ever tried it?', 'Did you ever tried it?', 'Have you ever try it?'], 0, 'Have + subject + V3.')],
  },
  {
    id: 'conditionals', stage: 'Этап 2 · Развиваем свободную речь', level: 'B1', title: 'Условные предложения и итоги месяца', range: [52, 60],
    theory: 'Zero Conditional описывает правила и факты: if + Present Simple, Present Simple. First Conditional говорит о реальном будущем: if + Present Simple, will + infinitive. Second Conditional — о воображаемой или маловероятной ситуации: if + Past Simple, would + infinitive; с be часто используется were для всех лиц. Unless означает if not. После when и as soon as в значении будущего используется настоящее время, а не will. Выбирайте тип по смыслу: закономерность, реальная возможность или мысленный эксперимент.',
    formula: 'If you heat ice, it melts. If I have time, I will call. If I had more time, I would travel. Unless it rains, we will go.',
    listeningIntro: 'If I finish work early, I will meet my friends. If the weather is good, we will walk by the river. If I had a completely free month, I would travel much farther.',
    vocabulary: vocabulary('make a decision|принять решение;consider the consequences|обдумать последствия;take a risk|пойти на риск;have a chance to|иметь шанс;make a difference|изменить ситуацию;deal with uncertainty|справляться с неопределённостью;as soon as possible|как можно скорее;unless something changes|если ничего не изменится;in case of|в случае;on one condition|при одном условии;weigh the options|взвесить варианты;imagine a situation|представить ситуацию;realistic possibility|реальная возможность;unlikely event|маловероятное событие;general rule|общее правило;future consequence|будущее последствие;regret a decision|жалеть о решении;choose a different path|выбрать другой путь;make the most of|использовать по максимуму;reflect on progress|осмыслить прогресс'),
    errors: [e('If it will rain, we will stay home.', 'If it rains, we will stay home.', 'После if в First Conditional нет will.'), e('If I would have time, I would help.', 'If I had time, I would help.', 'В if-части Second Conditional нужен Past Simple.'), e('If I was you, I would wait.', 'If I were you, I would wait.', 'В совете используется If I were you.'), e('Unless you do not hurry, you will be late.', 'Unless you hurry, you will be late.', 'Unless уже содержит отрицание.'), e('When I will arrive, I will call.', 'When I arrive, I will call.', 'После when о будущем используем Present Simple.'), e('If you heat water, it will boils.', 'If you heat water, it boils.', 'Факт выражается Zero Conditional.')],
    questions: [q('A general fact:', ['If you heat ice, it melts.', 'If you heat ice, it will melted.', 'If you heated ice, it would melts.'], 0, 'Zero Conditional: Present + Present.'), q('A real future possibility:', ['If I have time, I will call.', 'If I will have time, I call.', 'If I had time, I call.'], 0, 'First Conditional.'), q('An imaginary situation:', ['If I am rich, I travel.', 'If I were rich, I would travel.', 'If I will be rich, I would travel.'], 1, 'Second Conditional.'), q('Unless means:', ['if not', 'as soon as', 'because'], 0, 'Unless = if not.'), q('Correct future time clause:', ['When I arrive, I will call.', 'When I will arrive, I call.', 'When I would arrive, I call.'], 0, 'После when используем Present Simple.'), q('Correct advice:', ['If I were you, I would rest.', 'If I was you, I will rest.', 'If I would be you, I rested.'], 0, 'Устойчивая модель Second Conditional.')],
  },
  {
    id: 'passive', stage: 'Этап 3 · Переходим к естественной речи', level: 'B1', title: 'Пассивный залог и процессы', range: [61, 67],
    theory: 'Пассивный залог фокусируется на действии или результате, когда исполнитель неизвестен, очевиден или неважен. Он строится как be в нужном времени + V3. Present Simple Passive: is/are made; Past Simple Passive: was/were created. Исполнителя можно добавить после by, но это не обязательно. Для описания процесса используйте последовательность: first, next, then, after that, finally. Сохраняйте одно время на всём этапе и проверяйте согласование be с подлежащим.',
    formula: 'The product is made locally. The website was created in 2024. First the data is collected, then it is checked.',
    listeningIntro: 'Coffee beans are collected, dried and transported to a factory. Next, they are roasted at a high temperature. Finally, the coffee is packed and delivered to shops.',
    vocabulary: vocabulary('be made from|быть сделанным из;be used for|использоваться для;be created by|быть созданным кем-либо;be stored safely|безопасно храниться;be delivered to|доставляться в;collect the data|собирать данные;process information|обрабатывать информацию;follow a sequence|следовать последовательности;at the first stage|на первом этапе;in the next step|на следующем этапе;as a result|в результате;quality is checked|качество проверяется;access is provided|доступ предоставляется;account is created|аккаунт создаётся;order is confirmed|заказ подтверждается;request is processed|запрос обрабатывается;rules are explained|правила объясняются;service was launched|сервис был запущен;problem was solved|проблема была решена;final product|конечный продукт'),
    errors: [e('It is make in Italy.', 'It is made in Italy.', 'После be нужна V3.'), e('The app created in 2023.', 'The app was created in 2023.', 'В пассиве нужен be.'), e('The products is delivered.', 'The products are delivered.', 'Согласуйте be с множественным числом.'), e('The data was collect.', 'The data was collected.', 'Нужна третья форма.'), e('It was happened yesterday.', 'It happened yesterday.', 'Happen обычно не используется в пассиве.'), e('The system is use for payments.', 'The system is used for payments.', 'Use–used–used.')],
    questions: [q('Present passive:', ['It is made here.', 'It is make here.', 'It made here.'], 0, 'Be + V3.'), q('Past passive:', ['It was created in 2020.', 'It is create in 2020.', 'It was create in 2020.'], 0, 'Was + V3.'), q('Plural subject:', ['The files is stored.', 'The files are stored.', 'The files be stored.'], 1, 'С files используется are.'), q('Who performs an action is introduced by:', ['by', 'with', 'from'], 0, 'Исполнитель вводится предлогом by.'), q('Best process connector after first:', ['Never', 'Next', 'Ago'], 1, 'Next продолжает последовательность.'), q('Correct transformation of “People use this tool”:', ['This tool is used.', 'This tool uses.', 'This tool is use.'], 0, 'Объект становится подлежащим пассивной конструкции.')],
  },
  {
    id: 'reported', stage: 'Этап 3 · Переходим к естественной речи', level: 'B1 → B2', title: 'Косвенная речь и пересказ', range: [68, 74],
    theory: 'В пересказе say обычно используется без прямого объекта, а tell требует человека: she said that…, she told me that…. Если глагол сообщения стоит в прошлом, время часто сдвигается назад: am/is → was, present → past, will → would, have done → had done. Местоимения и указатели времени меняются по ситуации: today → that day, tomorrow → the next day. Для качественного пересказа сначала сформулируйте главную мысль, затем 2–3 детали и вывод. Полезные рамки: According to the speaker…, The main point is…, She explained that…',
    formula: '“I am busy.” → She said that she was busy. He told me that he would call. According to the speaker, the main issue is…',
    listeningIntro: 'The speaker said that the team was testing a new service. She explained that users had reported several issues and added that the updated version would be released the following week.',
    vocabulary: vocabulary('according to the speaker|по словам говорящего;the main point is|главная мысль состоит в;mention that|упомянуть что;point out that|указать что;explain clearly|ясно объяснить;summarize the idea|кратко изложить мысль;report a problem|сообщить о проблеме;add an important detail|добавить важную деталь;in other words|другими словами;from the speaker’s perspective|с точки зрения говорящего;the interview focuses on|интервью посвящено;draw a conclusion|сделать вывод;support a claim|подкрепить утверждение;leave out details|опустить детали;quote accurately|точно процитировать;retell a conversation|пересказать разговор;the following day|на следующий день;the week before|неделей ранее;at that moment|в тот момент;make it clear that|дать понять что'),
    errors: [e('She said me that…', 'She told me that…', 'Tell требует объект; say — нет.'), e('He told that he was busy.', 'He said that he was busy.', 'Без объекта используйте said.'), e('She said she is tired.', 'She said she was tired.', 'При прошедшем reporting verb обычно сдвигаем время.'), e('He said he will call.', 'He said he would call.', 'Will меняется на would.'), e('She told me she has finished.', 'She told me she had finished.', 'Present Perfect сдвигается в Past Perfect.'), e('He said tomorrow.', 'He said the next day.', 'Указатель времени меняется при пересказе.')],
    questions: [q('Correct with a person:', ['She said me.', 'She told me.', 'She told to me.'], 1, 'Tell + person.'), q('Correct without a person:', ['He said that he was ready.', 'He told that he was ready.', 'He said me he was ready.'], 0, 'Say не требует объекта.'), q('Reported “I will call”:', ['He said he will call.', 'He said he would call.', 'He said he called tomorrow.'], 1, 'Will → would.'), q('Reported “I am tired”:', ['She said she was tired.', 'She said she tired.', 'She told she is tired.'], 0, 'Am → was.'), q('A summary should start with:', ['Every small detail is…', 'The main point is…', 'I no understand…'], 1, 'Сначала назовите главную мысль.'), q('Tomorrow often becomes:', ['the next day', 'the yesterday', 'before day'], 0, 'Tomorrow → the next day.')],
  },
  {
    id: 'natural', stage: 'Этап 3 · Переходим к естественной речи', level: 'B1 → B2', title: 'Фразовые глаголы и естественные выражения', range: [75, 81],
    theory: 'Фразовый глагол нужно запоминать как цельное выражение в контексте: find out, figure out, put off. Значение часто нельзя получить дословным переводом частей. Некоторые глаголы разделяются объектом: pick it up; другие не разделяются: look after someone. Естественная речь использует связки для управления разговором: Actually…, To be honest…, The thing is…, What I mean is…, Let me think…. Они помогают выиграть время, уточнить мысль и выразить позицию без заполнителей. После изучения выражения создайте личный пример и используйте его в короткой истории.',
    formula: 'I found out the truth. We put the meeting off. Let me think… The thing is… What I mean is… From my point of view…',
    listeningIntro: 'To be honest, I almost gave up, but I figured out a simpler way to deal with the problem. It turned out that we had run out of space, so we set up a new account.',
    vocabulary: vocabulary('find out|выяснить;figure out|разобраться;give up|сдаться;keep up with|успевать за;look for|искать;look forward to|ждать с нетерпением;pick up|забрать или подхватить;put off|отложить;run out of|закончиться;set up|настроить;take care of|позаботиться о;work out|получиться или потренироваться;turn out|оказаться;deal with|справляться с;get used to|привыкнуть к;to be honest|если честно;the thing is|дело в том что;what I mean is|я имею в виду;that makes sense|это логично;from my point of view|с моей точки зрения'),
    errors: [e('I look forward to meet you.', 'I look forward to meeting you.', 'To здесь предлог, после него нужна форма -ing.'), e('We ran out from time.', 'We ran out of time.', 'Устойчивый предлог — of.'), e('I need figure out it.', 'I need to figure it out.', 'После need нужен to; местоимение разделяет глагол.'), e('She gave up to smoke.', 'She gave up smoking.', 'После give up используется -ing.'), e('I am used to work early.', 'I am used to working early.', 'После be used to нужна форма -ing.'), e('We put off it.', 'We put it off.', 'Местоимение ставится между частями разделяемого глагола.')],
    questions: [q('Correct form:', ['look forward to meet', 'look forward to meeting', 'look forward meet'], 1, 'После to-предлога — -ing.'), q('Correct pronoun position:', ['pick up it', 'pick it up', 'it pick up'], 1, 'Местоимение разделяет phrasal verb.'), q('Run out ___ time:', ['from', 'of', 'with'], 1, 'Устойчивая форма run out of.'), q('Give up is followed by:', ['verb-ing', 'to + verb always', 'past verb'], 0, 'Give up doing something.'), q('A natural thinking phrase:', ['Let me think.', 'Give me think.', 'I thinking now.'], 0, 'Let me think — естественная связка.'), q('“Разобраться”:', ['figure out', 'give up', 'run out'], 0, 'Figure out = понять/разобраться.')],
  },
  {
    id: 'intensive', stage: 'Этап 3 · Переходим к естественной речи', level: 'B2 practice', title: 'Разговорный интенсив и финальная проверка', range: [82, 90],
    theory: 'На финальном этапе отдельные правила объединяются в полноценную речь. Хороший ответ имеет тезис, объяснение, конкретный пример, альтернативную точку зрения и вывод. В проблемной ситуации сначала спокойно назовите проблему, затем уточните детали, предложите решение и подтвердите следующий шаг. При аудировании первый проход посвящён главной мысли, второй — деталям, третий — проверке и shadowing. Самокоррекция должна помогать, а не останавливать речь: закончите мысль, переформулируйте ключевую ошибку и продолжайте. В письменной работе сначала составьте план, затем проверьте времена, артикли, порядок слов, предлоги и повторы.',
    formula: 'My point is… The main reason is… For example… On the other hand… To sum up… The issue is… Could you clarify…? A possible solution would be…',
    listeningIntro: 'From my point of view, technology makes daily tasks easier, but it can also create new problems. For example, we save time online, while privacy and attention become harder to protect.',
    vocabulary: vocabulary('state an opinion|высказать мнение;support an argument|подкрепить аргумент;give a relevant example|привести уместный пример;consider another view|рассмотреть другую точку зрения;reach a conclusion|прийти к выводу;clarify the issue|уточнить проблему;suggest a solution|предложить решение;confirm the next step|подтвердить следующий шаг;handle a complaint|разобраться с жалобой;miss a connection|опоздать на пересадку;cancel a flight|отменить рейс;fix a technical issue|исправить техническую проблему;meet a deadline|уложиться в срок;take on a project|взяться за проект;learn independently|учиться самостоятельно;express myself clearly|ясно выражать мысли;keep the conversation going|поддерживать разговор;notice my own mistakes|замечать свои ошибки;understand the main idea|понимать главную мысль;make steady progress|стабильно прогрессировать'),
    errors: [e('From my point, technology helps.', 'From my point of view, technology helps.', 'Используйте полную связку.'), e('I am agree with this.', 'I agree with this.', 'Agree — обычный глагол, be не нужен.'), e('It depends from the situation.', 'It depends on the situation.', 'Depend используется с on.'), e('I suggest to change it.', 'I suggest changing it.', 'После suggest обычно нужна форма -ing.'), e('Can you explain me?', 'Can you explain it to me?', 'Explain something to someone.'), e('In the other hand…', 'On the other hand…', 'Устойчивая связка начинается с on.')],
    questions: [q('Correct opinion phrase:', ['From my point of view…', 'From my point…', 'On my point view…'], 0, 'Это устойчивая связка.'), q('Correct agreement:', ['I am agree.', 'I agree.', 'I agreeing.'], 1, 'Agree не требует be.'), q('Depend ___:', ['from', 'on', 'at'], 1, 'Depend on.'), q('Correct suggestion:', ['I suggest changing it.', 'I suggest to changing it.', 'I am suggest change.'], 0, 'Suggest + verb-ing.'), q('A strong answer includes:', ['only an opinion', 'a point, reason, example and conclusion', 'as many difficult words as possible'], 1, 'Структура делает ответ связным.'), q('First listening pass:', ['translate every word', 'identify the main idea', 'read the transcript immediately'], 1, 'Сначала определяем основную мысль.')],
  },
]

const p = (day: number, title: string, task: string, source: string, answer: string): DayPlan => ({ day, title, task, source, answer })

const dayPlans: DayPlan[] = [
  p(1, 'Диагностика: точка старта', 'Напишите 80–100 слов о себе и запишите двухминутный рассказ без подсказок.', 'Я живу в Москве, работаю дизайнером и изучаю английский, потому что хочу свободнее общаться.', 'I live in Moscow, work as a designer and study English because I want to communicate more confidently.'),
  p(2, 'Знакомство и уточняющие вопросы', 'Отработайте пять вопросов о работе, городе, интересах и целях собеседника.', 'Чем вы занимаетесь, откуда вы и что любите делать в свободное время?', 'What do you do, where are you from, and what do you like doing in your free time?'),
  p(3, 'Мой обычный день', 'Расскажите о распорядке дня в Present Simple, используя наречия частотности.', 'Обычно я встаю в семь, начинаю работу в девять и редко заканчиваю поздно.', 'I usually get up at seven, start work at nine and rarely finish late.'),
  p(4, 'Семья и друзья', 'Опишите двух близких людей: внешность, характер и ваши общие занятия.', 'Моя сестра общительная и надёжная, а мой лучший друг спокойный и очень терпеливый.', 'My sister is outgoing and reliable, while my best friend is calm and very patient.'),
  p(5, 'Работа или учёба', 'Расскажите об обязанностях, расписании и текущих задачах.', 'Я отвечаю за новый проект, встречаюсь с командой дважды в неделю и сейчас готовлю презентацию.', 'I am responsible for a new project, meet the team twice a week and am currently preparing a presentation.'),
  p(6, 'Разговор с носителем: знакомство', 'Проведите естественный диалог без предварительного перевода каждой фразы.', 'Я недавно переехал сюда. Что вы можете посоветовать в этом районе?', 'I have recently moved here. What can you recommend in this neighborhood?'),
  p(7, 'Повторение: кто я и моя неделя', 'Запишите трёхминутное голосовое сообщение и отметьте три ошибки после прослушивания.', 'Я работаю из дома, стараюсь заниматься каждый день и по выходным встречаюсь с друзьями.', 'I work from home, try to study every day and meet my friends on weekends.'),
  p(8, 'Регулярные действия', 'Составьте 15 правдивых предложений о регулярных действиях.', 'Я регулярно читаю на английском, но не всегда записываю новые выражения.', 'I regularly read in English, but I do not always write down new expressions.'),
  p(9, 'Пробный экзамен №1', 'Выполните грамматику, чтение, listening, двухминутный рассказ и текст на 80–100 слов.', 'Сейчас я могу рассказать о себе, задать базовые вопросы и описать свой обычный день.', 'I can now talk about myself, ask basic questions and describe my usual day.'),
  p(10, 'Что происходит сейчас', 'Опишите 15 действий, происходящих вокруг вас прямо сейчас.', 'Люди разговаривают, официант несёт кофе, а я жду своего друга.', 'People are talking, a waiter is carrying coffee, and I am waiting for my friend.'),
  p(11, 'Simple или Continuous', 'Создайте 10 пар, сравнивая привычку и временное действие.', 'Обычно я работаю в офисе, но сегодня работаю из дома.', 'I usually work in an office, but today I am working from home.'),
  p(12, 'Глаголы в живой речи', 'Прослушайте короткий материал, выпишите 10 глаголов и определите их время.', 'Ведущий обычно говорит медленно, но сегодня он объясняет тему быстрее.', 'The presenter usually speaks slowly, but today he is explaining the topic faster.'),
  p(13, 'Моя неделя и сегодняшний день', 'Проведите разговор, чередуя Present Simple и Present Continuous.', 'По понедельникам я учусь вечером, а сегодня готовлюсь к важной встрече.', 'I study in the evening on Mondays, and today I am preparing for an important meeting.'),
  p(14, 'Разбор ошибок и карточки', 'Классифицируйте ошибки экзамена и создайте карточки «ошибка → правило → свой пример».', 'Я часто забывал форму be, но теперь проверяю каждое предложение в Continuous.', 'I often forgot the verb be, but now I check every sentence in the Continuous tense.'),
  p(15, '20 неправильных глаголов', 'Выучите 20 частотных глаголов тройками V1–V2–V3 и используйте их в истории.', 'Вчера я поехал в центр, встретил друга, купил книгу и принёс её домой.', 'Yesterday I went downtown, met a friend, bought a book and brought it home.'),
  p(16, 'Что я делал вчера', 'Напишите связный рассказ, используя не менее восьми глаголов в Past Simple.', 'Вчера я закончил работу раньше, приготовил ужин и посмотрел документальный фильм.', 'Yesterday I finished work early, cooked dinner and watched a documentary.'),
  p(17, 'Памятное событие', 'Перескажите событие по структуре «контекст → события → результат → вывод».', 'Два года назад я впервые путешествовал один и понял, что могу решать проблемы самостоятельно.', 'Two years ago I travelled alone for the first time and realized that I could solve problems independently.'),
  p(18, 'Пробный экзамен №2', 'Проверьте настоящее и прошедшее время в грамматике, listening, письме и речи.', 'Раньше я говорил только короткими фразами, а теперь могу рассказать небольшую историю.', 'I used to speak only in short phrases, but now I can tell a short story.'),
  p(19, 'История на слух', 'Прослушайте историю дважды и восстановите последовательность из шести событий.', 'Сначала поезд опоздал, затем мы сели не на тот автобус, но в итоге добрались до отеля.', 'First the train was delayed, then we took the wrong bus, but in the end we reached the hotel.'),
  p(20, 'Интервью о выходных', 'Задайте не менее восьми вопросов и используйте уточняющие реплики.', 'Куда ты ездил на выходных и что тебе там понравилось больше всего?', 'Where did you go at the weekend, and what did you like most about it?'),
  p(21, 'Работа над ошибками Past Simple', 'Перепишите пять ошибок правильно и объясните каждое правило вслух.', 'Я написал went после did, а затем исправил предложение и объяснил почему.', 'I used went after did, then corrected the sentence and explained why.'),
  p(22, 'Планы на выходные', 'Расскажите о намерениях и уже назначенных встречах.', 'В субботу я собираюсь на выставку, а вечером встречаюсь с друзьями.', 'On Saturday I am going to an exhibition, and in the evening I am meeting my friends.'),
  p(23, 'Жизнь через пять лет', 'Составьте реалистичные прогнозы и отделите их от личных планов.', 'Через пять лет я, вероятно, буду жить в другом городе и работать над международными проектами.', 'Five years from now, I will probably live in another city and work on international projects.'),
  p(24, 'Договориться о встрече', 'Разыграйте диалог: предложение, отказ, альтернатива и подтверждение.', 'Я не могу во вторник. Как насчёт среды в половине седьмого?', 'I cannot make Tuesday. How about Wednesday at half past six?'),
  p(25, 'Письмо-приглашение', 'Напишите дружелюбное приглашение с причиной, временем, местом и просьбой ответить.', 'Мы устраиваем небольшой ужин в пятницу. Буду рад, если ты сможешь прийти.', 'We are having a small dinner on Friday. I would be happy if you could come.'),
  p(26, 'Планы на слух', 'Найдите в диалоге will, going to и Present Continuous и объясните выбор.', 'Мы встречаемся в десять, собираемся посетить музей, а билеты я куплю сейчас.', 'We are meeting at ten, we are going to visit the museum, and I will buy the tickets now.'),
  p(27, 'Пробный экзамен №3', 'Проверьте настоящее, прошлое и будущее во всех четырёх навыках.', 'Я могу объяснить, что делаю обычно, что произошло вчера и что планирую дальше.', 'I can explain what I usually do, what happened yesterday and what I am planning next.'),
  p(28, 'Разбор экзамена №3', 'Разделите ошибки на времена, порядок слов, лексику и произношение.', 'Большинство моих ошибок связано не с правилом, а с тем, что я говорю слишком быстро.', 'Most of my mistakes are not about the rule; they happen because I speak too quickly.'),
  p(29, 'Цели на ближайший год', 'Проведите пятиминутный разговор о трёх целях и конкретных шагах.', 'В этом году я планирую улучшить английский и начать использовать его на работе.', 'This year I plan to improve my English and start using it at work.'),
  p(30, 'Контроль первого месяца', 'Запишите пятиминутный монолог о себе, неделе, прошлом, планах и прогрессе.', 'За первый месяц я стал говорить дольше и теперь лучше различаю основные времена.', 'During the first month, I have started speaking for longer and can now distinguish the main tenses better.'),
  p(31, 'Что я умею', 'Расскажите о текущих навыках и о том, чему хотите научиться.', 'Я умею работать с данными, но хотел бы научиться уверенно выступать перед людьми.', 'I can work with data, but I would like to learn how to speak confidently in public.'),
  p(32, '10 советов по английскому', 'Дайте практичные советы и объясните причину каждого.', 'Тебе стоит говорить вслух каждый день, даже если у тебя только десять минут.', 'You should speak aloud every day, even if you only have ten minutes.'),
  p(33, 'Правила и обязанности', 'Опишите правила дома, на работе или учёбе, различая must и have to.', 'На работе мы должны защищать данные, но нам не обязательно приходить в офис ежедневно.', 'At work we have to protect data, but we do not have to come to the office every day.'),
  p(34, 'Вежливые просьбы', 'Разыграйте просьбы о помощи, повторении и дополнительной информации.', 'Не могли бы вы повторить последнюю часть немного медленнее?', 'Would you mind repeating the last part a little more slowly?'),
  p(35, 'Советы на слух', 'Прослушайте рекомендации, выберите пять полезных и перескажите их своими словами.', 'Спикер советует ставить маленькие цели и не сравнивать себя с другими.', 'The speaker recommends setting small goals and not comparing yourself with others.'),
  p(36, 'Пробный экзамен №4', 'Выполните накопительный тест и дайте совет человеку, меняющему свою жизнь.', 'Тебе не нужно менять всё сразу; можно начать с одной небольшой привычки.', 'You do not have to change everything at once; you can start with one small habit.'),
  p(37, 'Разбор модальных ошибок', 'Объясните разницу между запретом, обязанностью и отсутствием необходимости.', 'Здесь нельзя парковаться, но тебе не обязательно приезжать на машине.', 'You must not park here, but you do not have to come by car.'),
  p(38, 'Сравнение двух городов', 'Сравните транспорт, стоимость, ритм и качество жизни.', 'Этот город меньше, но транспорт здесь намного удобнее и жильё немного дешевле.', 'This city is smaller, but public transport is much more convenient and housing is slightly cheaper.'),
  p(39, 'Сравнение продуктов', 'Сравните два фильма, приложения или устройства по трём критериям.', 'Первое приложение проще, а второе надёжнее и лучше подходит для командной работы.', 'The first app is easier, while the second is more reliable and better for teamwork.'),
  p(40, 'Идеальное место для жизни', 'Опишите место и обоснуйте каждый критерий.', 'Идеальное место должно быть достаточно спокойным для работы и достаточно живым для отдыха.', 'An ideal place should be quiet enough for work and lively enough for leisure.'),
  p(41, 'Характер: точные прилагательные', 'Выучите 20 прилагательных и опишите трёх людей без слов good и bad.', 'Мой коллега любознательный, внимательный и надёжный, но иногда слишком осторожный.', 'My colleague is curious, thoughtful and reliable, but sometimes too cautious.'),
  p(42, 'Дом или офис', 'Обсудите преимущества, недостатки и компромисс удалённой работы.', 'Работа дома гибче, но офис лучше для быстрых обсуждений и командного общения.', 'Working from home is more flexible, but the office is better for quick discussions and team communication.'),
  p(43, 'Сравнительный текст', 'Напишите 120 слов с критериями, связками и выводом.', 'Хотя поезд быстрее автобуса, автобус дешевле и иногда намного удобнее.', 'Although the train is faster than the bus, the bus is cheaper and sometimes much more convenient.'),
  p(44, 'Точная лексика вместо good и bad', 'Отредактируйте текст, заменив общие слова конкретными.', 'Фильм был не просто интересным, а увлекательным и заставляющим задуматься.', 'The film was not simply interesting; it was engaging and thought-provoking.'),
  p(45, 'Мой жизненный опыт', 'Составьте 15 предложений с ever, never, already, yet и just.', 'Я уже сменил профессию, но ещё никогда не работал за границей.', 'I have already changed careers, but I have never worked abroad.'),
  p(46, 'Интервью Have you ever…?', 'Ответьте на вопросы об опыте и добавьте конкретную историю в Past Simple.', 'Я дважды путешествовал один; последняя поездка была в прошлом году.', 'I have travelled alone twice; my last trip was last year.'),
  p(47, 'Past Simple или Present Perfect', 'Создайте 10 пар «опыт → конкретная история».', 'Я несколько раз выступал публично. В прошлом месяце я выступил перед ста людьми.', 'I have spoken in public several times. Last month I spoke in front of a hundred people.'),
  p(48, 'Пробный экзамен №5', 'Проверьте времена Simple и Present Perfect в речи, письме и listening.', 'Я изучаю английский уже несколько месяцев и за это время многому научился.', 'I have studied English for several months and have learned a lot during that time.'),
  p(49, 'Разбор Perfect-ошибок', 'Найдите неверные V3, for/since и маркеры завершённого времени.', 'Я использовал Present Perfect с yesterday, но теперь понимаю, почему нужен Past Simple.', 'I used the Present Perfect with yesterday, but now I understand why the Past Simple is required.'),
  p(50, 'Интервью о жизненном опыте', 'Проведите разговор с четырьмя follow-up вопросами.', 'Какой самый сложный навык ты когда-либо осваивал и сколько времени это заняло?', 'What is the most difficult skill you have ever learned, and how long did it take?'),
  p(51, 'Чему я научился', 'Запишите рассказ о развитии за несколько лет, сочетая Perfect и Past Simple.', 'За последние годы я стал увереннее, потому что завершил несколько сложных проектов.', 'Over the last few years, I have become more confident because I completed several challenging projects.'),
  p(52, 'Zero Conditional: правила', 'Составьте 12 фактов, инструкций и закономерностей.', 'Если я не повторяю новые выражения, я быстро их забываю.', 'If I do not review new expressions, I forget them quickly.'),
  p(53, 'First Conditional: следующая неделя', 'Опишите пять реальных возможностей и их последствия.', 'Если я закончу проект вовремя, то возьму свободный день в пятницу.', 'If I finish the project on time, I will take Friday off.'),
  p(54, 'Реальное или воображаемое', 'Ответьте на вопросы с First и Second Conditional и объясните выбор.', 'Если у меня будут свободные выходные, я поеду за город; если бы у меня был месяц, я бы путешествовал.', 'If I have a free weekend, I will go to the countryside; if I had a month, I would travel.'),
  p(55, 'Если бы я мог изменить одну вещь', 'Напишите 150 слов с Second Conditional и конкретными последствиями.', 'Если бы я мог изменить одну привычку, я бы перестал откладывать сложные задачи.', 'If I could change one habit, I would stop putting difficult tasks off.'),
  p(56, 'Сложное решение', 'Разыграйте разговор: варианты, риски, совет и окончательное решение.', 'Если я приму это предложение, мне придётся переехать, но я получу ценный опыт.', 'If I accept this offer, I will have to move, but I will gain valuable experience.'),
  p(57, 'Пробный экзамен №6', 'Выполните накопительный экзамен с устной частью по conditionals.', 'Если бы я мог начать курс заново, я бы раньше начал записывать и анализировать свою речь.', 'If I could start the course again, I would begin recording and analysing my speech earlier.'),
  p(58, 'Карточки условных ошибок', 'Создайте пары «ошибка → тип условия → правильный пример».', 'После if я ошибочно использовал will, а теперь ставлю Present Simple.', 'I incorrectly used will after if, and now I use the Present Simple.'),
  p(59, 'Повторение второго месяца', 'Повторите modals, comparisons, Perfect и conditionals; говорите по две минуты на три темы.', 'Я могу давать советы, сравнивать варианты и говорить об опыте и возможностях.', 'I can give advice, compare options and talk about experience and possibilities.'),
  p(60, 'Итоговое письмо месяца', 'Напишите 180–200 слов об изменениях в жизни и будущих целях, затем проведите самопроверку.', 'За последние годы многое изменилось, и если я сохраню темп, то достигну следующей цели.', 'A lot has changed over the last few years, and if I keep going, I will achieve my next goal.'),
  p(61, 'Как производится продукт', 'Опишите производство знакомого продукта в Present Simple Passive.', 'Сначала зёрна собирают и сушат, затем их обжаривают и упаковывают.', 'First, the beans are collected and dried; then they are roasted and packed.'),
  p(62, 'Как создаётся приложение', 'Опишите этапы от идеи и дизайна до тестирования и запуска.', 'Сначала определяются требования, затем создаётся дизайн и продукт тестируется пользователями.', 'First, the requirements are defined; then the design is created and the product is tested by users.'),
  p(63, 'Active → Passive', 'Преобразуйте 10 активных предложений и объясните, почему исполнитель неважен.', 'Команда проверяет данные каждый день. Данные проверяются каждый день.', 'The team checks the data every day. The data is checked every day.'),
  p(64, 'Научный процесс на слух', 'Прослушайте объяснение и восстановите этапы процесса.', 'Вода нагревается, превращается в пар, а затем охлаждается и снова становится жидкостью.', 'Water is heated, turns into steam, and is then cooled until it becomes liquid again.'),
  p(65, 'Правила сервиса', 'Объясните регистрацию, подтверждение и основные действия пользователя.', 'После создания аккаунта адрес подтверждается, а пользователю предоставляется доступ.', 'After the account is created, the address is confirmed and access is provided to the user.'),
  p(66, 'Пробный экзамен №7', 'Выполните накопительный экзамен и опишите незнакомый процесс.', 'Сначала информация собирается, затем проверяется и в конце сохраняется в системе.', 'First, the information is collected, then it is checked and finally stored in the system.'),
  p(67, 'Разбор пассивных ошибок', 'Проверьте форму be, V3, число и время в каждом предложении.', 'Я забывал форму be, поэтому теперь подчёркиваю её перед проверкой V3.', 'I used to forget the form of be, so now I underline it before checking the past participle.'),
  p(68, 'Пересказ пяти высказываний', 'Передайте смысл, меняя местоимения, времена и указатели времени.', 'Она сказала, что работает дома и закончит проект на следующий день.', 'She said that she worked from home and would finish the project the next day.'),
  p(69, 'Интервью: основные ответы', 'Прослушайте интервью и передайте главную мысль каждого ответа.', 'По словам спикера, команда изменила подход после отзывов пользователей.', 'According to the speaker, the team changed its approach after receiving user feedback.'),
  p(70, 'Краткое содержание видео', 'Напишите 100–120 слов: тема, три ключевые мысли и вывод.', 'Главная мысль видео состоит в том, что небольшие привычки дают устойчивый результат.', 'The main point of the video is that small habits produce sustainable results.'),
  p(71, 'Разговор в косвенной речи', 'Передайте диалог двух людей, используя say, tell и reporting verbs.', 'Он сказал, что опоздает, а она попросила его предупредить команду.', 'He said that he would be late, and she asked him to inform the team.'),
  p(72, 'Пробный экзамен №8', 'Проверьте понимание и пересказ информации в listening, reading и speaking.', 'Спикер объяснил, почему проект задержался, и добавил, что новая дата уже согласована.', 'The speaker explained why the project had been delayed and added that the new date had already been agreed.'),
  p(73, 'Разбор ошибок пересказа', 'Найдите ошибки say/tell, сдвига времени и лишние детали.', 'Я пытался повторить каждое слово, но теперь сначала формулирую главную мысль.', 'I tried to repeat every word, but now I formulate the main idea first.'),
  p(74, 'Трёхминутный пересказ', 'Перескажите новость, статью или видео без чтения готового текста.', 'Согласно статье, удалённая работа изменила то, как команды обмениваются информацией.', 'According to the article, remote work has changed the way teams share information.'),
  p(75, 'История с phrasal verbs', 'Создайте историю минимум с пятью фразовыми глаголами.', 'Я выяснил причину, разобрался с настройками и в итоге решил не сдаваться.', 'I found out the cause, figured out the settings and eventually decided not to give up.'),
  p(76, 'Разговор без сценария', 'Говорите 10 минут, используя только короткий список опорных выражений.', 'Если честно, я не уверен, но мне кажется, что этот подход может сработать.', 'To be honest, I am not sure, but I think this approach might work.'),
  p(77, 'Паузы и связки', 'Замените эээ на естественные связки и сохраняйте спокойный темп.', 'Дай подумать. Дело в том, что у обеих идей есть серьёзные преимущества.', 'Let me think. The thing is that both ideas have significant advantages.'),
  p(78, 'Естественный диалог на слух', 'Выпишите 10 разговорных выражений и определите их функцию.', 'Спикер сказал «that makes sense», чтобы принять аргумент и продолжить обсуждение.', 'The speaker said “that makes sense” to acknowledge the argument and continue the discussion.'),
  p(79, 'От перевода к естественной фразе', 'Переведите текст, затем перепишите его без русских конструкций.', 'Я очень жду нашей встречи и надеюсь, что нам удастся всё обсудить.', 'I am really looking forward to our meeting and hope we can discuss everything.'),
  p(80, 'Пробный экзамен №9', 'Проверьте естественность речи, связки и активное использование выражений.', 'С моей точки зрения, проблема решаема; нам просто нужно разобраться в причинах.', 'From my point of view, the problem can be solved; we just need to figure out the causes.'),
  p(81, 'Мои 20 активных выражений', 'Выберите выражения, создайте личные примеры и запланируйте повторение.', 'Я хочу активно использовать эти выражения, а не только узнавать их в тексте.', 'I want to use these expressions actively, not just recognize them in a text.'),
  p(82, 'Повседневная жизнь', 'Проведите 15–20 минут разговора о привычках, еде, покупках, отдыхе и доме.', 'Обычно я планирую покупки заранее, но иногда принимаю решения прямо в магазине.', 'I usually plan my shopping in advance, but sometimes I make decisions in the store.'),
  p(83, 'Путешествия и проблемы', 'Разыграйте аэропорт, отель, ресторан и проблему с бронированием.', 'Мой рейс отменили, и я хотел бы узнать, какие альтернативы доступны.', 'My flight has been cancelled, and I would like to know what alternatives are available.'),
  p(84, 'Работа и образование', 'Обсудите обязанности, проекты, дедлайны, цели и обучение.', 'Сейчас я веду важный проект и стараюсь закончить первый этап до пятницы.', 'I am currently leading an important project and trying to complete the first stage by Friday.'),
  p(85, 'Мнение и аргументы', 'Обсудите спорную тему по структуре «позиция → аргумент → пример → другая сторона → вывод».', 'Онлайн-образование доступнее, но личное общение всё ещё важно для некоторых навыков.', 'Online education is more accessible, but face-to-face communication is still important for certain skills.'),
  p(86, 'Решение проблем', 'Разыграйте пять ситуаций: заказ, рейс, опоздание, приложение и непонимание.', 'Приложение не принимает оплату. Не могли бы вы проверить операцию и предложить решение?', 'The app is not accepting my payment. Could you check the transaction and suggest a solution?'),
  p(87, 'Повторение грамматики', 'Повторите восемь ключевых тем и выпишите пять собственных частых ошибок.', 'Я проверяю время, форму глагола, порядок слов, артикли и предлоги.', 'I check the tense, verb form, word order, articles and prepositions.'),
  p(88, 'Listening 8–10 минут', 'Прослушайте материал трижды: главная мысль, детали, проверка; затем перескажите.', 'Я понял основную мысль без субтитров, а при втором прослушивании записал ключевые детали.', 'I understood the main idea without subtitles and noted the key details during the second listening.'),
  p(89, 'Разговорная репетиция', 'Говорите по две минуты на восемь финальных тем и задавайте себе follow-up вопросы.', 'Моё главное достижение — я могу продолжать разговор, даже когда не знаю точного слова.', 'My biggest achievement is that I can keep a conversation going even when I do not know the exact word.'),
  p(90, 'Финальный экзамен №10', 'Выполните 30 заданий по грамматике, 20 по лексике, reading, listening, письмо и устную часть.', 'За девяносто дней я стал говорить увереннее, лучше понимать речь и замечать собственные ошибки.', 'Over ninety days, I have become more confident, understand spoken English better and notice my own mistakes.'),
]

export const examDays = new Map([[9, 1], [18, 2], [27, 3], [36, 4], [48, 5], [57, 6], [66, 7], [72, 8], [80, 9], [90, 10]])

function rotate<T>(items: T[], offset: number, count: number): T[] {
  return Array.from({ length: Math.min(count, items.length) }, (_, index) => items[(offset + index) % items.length]!)
}

function topicFor(day: number): TopicPack {
  const topic = topicPacks.find((item) => day >= item.range[0] && day <= item.range[1])
  if (!topic) throw new Error(`Не найдена тема для дня ${day}`)
  return topic
}

export const english90Days: English90Day[] = dayPlans.map((plan) => {
  const topic = topicFor(plan.day)
  const offset = plan.day - topic.range[0]
  const words = rotate(topic.vocabulary, offset * 3, 8).map(([front, back]) => [
    front,
    back,
    `Составьте личный пример с выражением «${front}».`,
  ] as [string, string, string])

  return {
    day: plan.day,
    stage: topic.stage,
    level: topic.level,
    title: plan.title,
    goal: plan.task,
    task: plan.task,
    theory: topic.theory,
    formula: topic.formula,
    conversation: `${plan.task} Собеседник задаёт по одному уточняющему вопросу, отвечает естественно и в конце отмечает повторяющиеся ошибки.`,
    transcript: `${topic.listeningIntro} ${plan.answer}`,
    vocabulary: words,
    errors: rotate(topic.errors, offset, 3),
    translation: { source: plan.source, answer: plan.answer },
    questions: rotate(topic.questions, offset, 4),
    exam: examDays.get(plan.day),
  }
})

export const english90Modules = topicPacks.map((topic) => ({
  id: topic.id,
  title: `${topic.stage} · ${topic.title}`,
  range: topic.range,
  level: topic.level,
}))

export function buildSpacedCards(dayIndex: number): Flashcard[] {
  const indexes = [dayIndex, dayIndex - 1, dayIndex - 3, dayIndex - 7, dayIndex - 14].filter((index) => index >= 0)
  const cards: Flashcard[] = []
  const add = (card: Flashcard) => {
    if (!cards.some((item) => item.front === card.front)) cards.push(card)
  }

  for (const index of indexes) {
    for (const [front, back, hint] of english90Days[index]!.vocabulary) {
      add({ front, back, hint })
      if (cards.length === 20) return cards
    }
  }

  for (const [front, back] of english90Days[dayIndex]!.vocabulary) {
    add({ front: `RU: ${back}`, back: front, hint: 'Вспомните английское выражение и произнесите свой пример.' })
    if (cards.length === 20) return cards
  }

  for (const item of english90Days[dayIndex]!.errors) {
    add({ front: `Исправьте: ${item.incorrect}`, back: item.correct, hint: item.explanation })
    if (cards.length === 20) return cards
  }

  add({ front: `Формула дня ${dayIndex + 1}`, back: english90Days[dayIndex]!.formula, hint: 'Воспроизведите модель без чтения.' })
  return cards.slice(0, 20)
}

export function getCourseQuestionBank(day: number): CourseQuestion[] {
  const questions = topicPacks
    .filter((topic) => topic.range[0] <= day)
    .flatMap((topic) => topic.questions)
  return questions.filter((item, index) => questions.findIndex((candidate) => (
    candidate.question === item.question && candidate.options.join('|') === item.options.join('|')
  )) === index)
}
