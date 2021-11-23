// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import kubernetes from '../../../services/kubernetes';
import { firstValueFrom } from "rxjs";

type Data = {
    name: string
}

export default async function handler(
    req: NextApiRequest,
    // res: NextApiResponse<Data>
    res: NextApiResponse<any>
    ) {
        const { method } = req;
        if (method !== "GET") {
            res.status(405);
        } else {
            try {
                const resources = await firstValueFrom(kubernetes.getAllApiResourceTypes());
                // console.log("RESPONDING!", resources);
                res.status(200).json(resources);
            } catch (e) {
                console.log("ERROR!", e);
                res.status(500).json(e);
            }
        }
        res.end();
    }
    