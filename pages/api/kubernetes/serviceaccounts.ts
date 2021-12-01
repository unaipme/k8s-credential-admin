import { NextApiRequest, NextApiResponse } from "next";
import kubernetes, { ServiceAccount } from "../../../services/kubernetes";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<any>
) {
    const { method } = req;
    if (method === "POST") {
        try {
            const serviceAccount: ServiceAccount = JSON.parse(req.body);
            await kubernetes.createServiceAccount(serviceAccount);
            res.status(200);
        } catch (e) {
            res.status(500).json({ error: e });
        }
    } else {
        res.status(405);
    }
    res.end();
}