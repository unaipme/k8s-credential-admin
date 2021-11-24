import { Tooltip, Chip } from "@mui/material";
import { NextPage } from "next";
import React from "react";
import kubernetes, { RuleVerb } from "../services/kubernetes";

type VerbChipProps = {
    verb: RuleVerb;
    onDelete?: () => void;
}

const VerbChip: NextPage<VerbChipProps> = ({ verb, onDelete }) => (
    <Tooltip key={verb} title={kubernetes.info.rbac.verbs[verb]}>
        <Chip label={verb} style={{ cursor: "help" }} onDelete={onDelete} />
    </Tooltip>
);

export default VerbChip;