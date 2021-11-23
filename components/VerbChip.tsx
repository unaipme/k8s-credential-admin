import { Tooltip, Chip } from "@mui/material";
import { NextPage } from "next";
import React from "react";
import kubernetes, { RuleVerb } from "../services/kubernetes";

const VerbChip: NextPage<{ verb: RuleVerb }> = ({ verb }) => (
    <Tooltip key={verb} title={kubernetes.info.rbac.verbs[verb]}>
        <Chip label={verb} style={{ cursor: "help" }} />
    </Tooltip>
);

export default VerbChip;