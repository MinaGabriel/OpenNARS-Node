
// ───── Imports ─────
import { Budget } from "../Budget";
import { Concept } from "../Concept";
import { Sentence } from "../Sentence";
import { Truth } from "../Truth";
import { Term } from '../Term';
import { table } from "table"; //  npm install table
import _ from 'lodash';
import colors from 'ansi-colors';
import { MemoryStore } from '../storage/MemoryStore';
import { Task } from '../Task';
import { Judgement } from '../Judgement';
import { Goal } from '../Goal';
import { Question } from '../Question';
import winston from 'winston';
import fs from 'fs';
import path from 'path';
import stringify from 'json-stringify-pretty-compact';
import { Parameters } from "../Parameters";
import { TemporalTypes } from "../enums/Enums";
import { Stamp } from "../Stamp";


export class StringFunctions {
    static mapToStringObject<T>(map: Map<string, T>): { [key: string]: string } {
        const obj: { [key: string]: string } = {};
        map.forEach((value, key) => {
            obj[key] = String(value);
        });
        return obj;
    }
}
 