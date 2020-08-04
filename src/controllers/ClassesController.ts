import db from "../database/connection";
import convertHoursToMinutes from "../utils/convertHourToMinutes";
import {Request, Response} from "express";

interface scheduleItem {
    week_day: number;
    from: string;
    to: string;
}

export default class ClassesController {

    public async index(req: Request, res: Response) {
        const filters = req.query;

        const week_day = filters.week_day as string;
        const subject = filters.subject as string;
        const time = filters.time as string;

        if (!filters.week_day || !filters.subject || !filters.time) {
            return res.status(400).json({
                error: 'Missing filters to search classes'
            })
        }

        const timeInMinutes = convertHoursToMinutes(time);

        const classes = await db('classes')
            .whereExists(function () {
                this.select('class_schedules.*')
                    .from('class_schedules')
                    .whereRaw('`class_schedules`.`class_id` = `classes`.`id`')
                    .whereRaw('`class_schedules`.`week_day` = ??', [Number(week_day)])
                    .whereRaw('`class_schedules`.`from` <= ??', [Number(timeInMinutes)])
                    .whereRaw('`class_schedules`.`to` > ??', [Number(timeInMinutes)])
            })
            .where('classes.subject', '=', subject)
            .join('users', 'classes.user_id', '=', 'users.id')
            .select(['classes.*', 'users.*'])

        return res.json(classes);
    }

    public async create(req: Request, res: Response) {
        const {
            name, avatar, whatsapp, bio, subject, cost, schedule
        } = req.body;


        const trx = await db.transaction();
        try {
            const insertedUsersIds = await trx('users').insert({
                name, avatar, whatsapp, bio
            });
            const user_id = insertedUsersIds[0];
            const insertedUClassesIds = await trx('classes').insert({
                user_id,
                subject,
                cost
            });

            const class_id = insertedUClassesIds[0];

            const classSchedule = schedule.map((scheduleItem: scheduleItem) => {

                return {
                    class_id,
                    week_day: scheduleItem.week_day,
                    from: convertHoursToMinutes(scheduleItem.from),
                    to: convertHoursToMinutes(scheduleItem.to),
                }
            });

            await trx('class_schedules').insert(classSchedule)
            trx.commit();

            return res.status(201).send();

        } catch (err) {
            await trx.rollback();
            return res.status(400).json({
                error: 'Unexpected error while trying create new class'
            })
        }
    }
}
