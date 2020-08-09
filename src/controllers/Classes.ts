import { Request, Response } from 'express'
import db from '../database/connection'
import convertHourToMinutes from '../utils/convertHoursToMinutes'

interface ScheduleItem {
    week_day: number
    from: string
    to: string
}

export default class Classes {
    async index(req: Request, res: Response) {
        const filters = req.query

        if (!filters.week_day || !filters.subject || !filters.time) {
            return res.status(400).json({
                error: 'Missing fields on request'
            })
        }

        try {
            const timeInMinutes = convertHourToMinutes(filters.time as string)
            const classes = await db('classes')
                .whereExists(function () {
                    this.select('classes_schedule.*')
                        .from('classes_schedule')
                        .whereRaw('`classes_schedule`.`classes_id` = `classes`.`id`')
                        .whereRaw('`classes_schedule`.`week_day` = ??', [Number(filters.week_day)])
                        .whereRaw('`classes_schedule`.`from` <= ??', [timeInMinutes])
                        .whereRaw('`classes_schedule`.`to` > ??', [timeInMinutes])
                })
                .where('classes.subject', '=', filters.subject as string)
                .join('users', 'classes.users_id', '=', 'users.id')
                .select(['classes.*', 'users.*'])

            return res.status(200).json({
                message: 'ok!',
                classes
            })
        } catch (error) {
            return res.status(500).json({
                message: 'error',
                error
            })
        }
    }

    async all(req: Request, res: Response) {
        try {
            const classes = await db('classes')
                .join('users', 'classes.users_id', '=', 'users.id')
                .limit(10)

            return res.status(200).json({
                message: 'ok!',
                classes
            })
        } catch (error) {
            return res.status(500).json({
                message: 'error',
                error
            })
        }
    }

    async create(req: Request, res: Response) {
        const { name, avatar, whatsapp, bio, subject, cost, schedule } = req.body

        const transaction = await db.transaction()

        const users_id = (
            await transaction('users').insert({
                name,
                avatar,
                whatsapp,
                bio
            })
        )[0]

        const classes_id = (
            await transaction('classes').insert({
                subject,
                cost,
                users_id
            })
        )[0]

        const classSchedule = schedule.map((ScheduleItem: ScheduleItem) => {
            return {
                classes_id: classes_id,
                week_day: Number(ScheduleItem.week_day),
                from: convertHourToMinutes(ScheduleItem.from),
                to: convertHourToMinutes(ScheduleItem.to)
            }
        })

        await transaction('classes_schedule').insert(classSchedule)
        await transaction.commit()
        try {
            return res.status(201).json({ status: true, message: 'Created Classes' })
        } catch (error) {
            await transaction.rollback()
            return res.status(500).json({
                status: false,
                message: 'Unexpected error while creating new class',
                error
            })
        }
    }
}
