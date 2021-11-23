import { NextApiRequest, NextApiResponse } from "next";
import { firstValueFrom } from "rxjs";
import kubernetes, { Role } from "../../../services/kubernetes";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<any>
) {
    console.log("Role API call");
    const { method } = req;
    if (method === "POST") {
        const role: Role = JSON.parse(req.body);
        try {
            await firstValueFrom(kubernetes.createRole(role));
            res.status(201);
        } catch (e) {
            res.status(500).json({
                error: e
            });
        }
    } else if (method === "DELETE") {
        const role: Role = JSON.parse(req.body);
        try {
            console.log("Deleting role", role.metadata.name);
            await firstValueFrom(kubernetes.deleteRole(role));
            console.log("Deleted role successfully", role.metadata.name);
            res.status(201);
        } catch (e) {
            console.log("Role deletion failed", role.metadata.name);
            res.status(500).json({
                error: e
            })
        }
    } else {
        res.status(405);
    }
    res.end();
}