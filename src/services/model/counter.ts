import {Document, Schema, db} from "./base";

export interface ICounterDocument extends Document {
    _id: string;
    seq: number;
}

const CounterSchema = new Schema({
    _id: {type: String, required: true},
    seq: {type: Number, default: 0},
});

export const CounterModel = db.model<ICounterDocument>("counter", CounterSchema);

export class CounterHelper {

    static async get(counterId: string) {
        let counter = await CounterModel.findById({_id: counterId});
        if (!counter) {
            counter = new CounterModel({_id: counterId, seq: 0});
            await counter.save();
        }
        return counter.seq;
    }

    static async incAndGet(counterId: string) {
        const counter = await CounterModel.findOneAndUpdate(
            {_id: counterId},
            {$inc: {seq: 1}},
            {
                new: true, // using value after updated
                upsert: true, // insert if it's not exist
            });
        if (counter) {
            return counter.seq;
        }
        return 0;
    }
}
