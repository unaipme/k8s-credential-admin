import { NextApiRequest, NextApiResponse } from "next";
import { firstValueFrom } from "rxjs";
import kubernetes, { Role } from "../../../services/kubernetes";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<any>
) {
    console.log("Role API call");
    const { method } = req;
    const role: Role = JSON.parse(req.body);
    if (method === "POST") {
        try {
            await firstValueFrom(kubernetes.createRole(role));
            res.status(201);
        } catch (e) {
            res.status(500).json({
                error: e
            });
        }
    } else if (method === "DELETE") {
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
    } else if (method === "PUT") {
        try {
            console.log("Updating role", role.metadata.name);
            await firstValueFrom(kubernetes.updateRole(role));
            console.log("Updated role successfully", role.metadata.name);
            res.status(201);
        } catch (e) {
            console.log("Role update failed", role.metadata.name);
            res.status(500).json({
                error: e
            })
        }
    } else {
        res.status(405);
    }
    res.end();
}