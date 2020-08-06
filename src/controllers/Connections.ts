import { Request, Response } from 'express'
import db from '../database/connection'

export default class Connections {
    async index(req: Request, res: Response) {
        try {
            const totalConnections = (await db('connections').count('* as total'))[0]
            return res.status(200).json(totalConnections)
        } catch (error) {
            return res.status(500).json({
                message: 'error',
                error
            })
        }
    }

    async create(req: Request, res: Response) {
        const { user_id } = req.body
        const transaction = await db.transaction()

        try {
            await transaction('connections').insert({
                user_id
            })
            await transaction.commit()
            return res.status(201).json({ status: true, message: 'Created Connection' })
        } catch (error) {
            await transaction.rollback()
            return res.status(500).json({
                status: false,
                message: 'Unexpected error while creating new connection',
                error
            })
        }
    }
}
