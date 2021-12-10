import { NextApiRequest, NextApiResponse } from "next";
import { firstValueFrom } from "rxjs";
import kubernetes, { ServiceAccount } from "../../../services/kubernetes";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<any>
) {
    const { method } = req;
    if (method === "POST") {
        try {
            const serviceAccount: ServiceAccount = JSON.parse(req.body);
            await firstValueFrom(kubernetes.createServiceAccount(serviceAccount));
            res.status(200);
        } catch (error: any) {
            res.status(error?.code || 500).json({ error });
        }
    } else {
        res.status(405);
    }
    res.end();
}