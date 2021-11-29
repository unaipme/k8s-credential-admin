import { NextApiRequest, NextApiResponse } from "next";
import { firstValueFrom } from "rxjs";
import kubernetes from "../../../../services/kubernetes";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<any>
) {
    const { method } = req;
    const { namespace } = req.query;
    if (method === "GET") {
        try {
            const data = await firstValueFrom(kubernetes.getNamespaceRoles(namespace as string));
            res.status(200).json(data);
        } catch (e) {
            res.status(500).json({ error: e });
        }
    } else {
        res.status(405);
    }
    res.end();
}