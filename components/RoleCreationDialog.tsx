import { Add, Delete } from "@mui/icons-material";
import { Box, Button, ButtonGroup, Dialog, DialogContent, DialogContentText, DialogTitle, IconButton, MenuItem, Paper, Select, SelectChangeEvent, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from "@mui/material";
import { NextPage } from "next";
import React, { useState } from "react";
import useSWR from "swr";
import { ApiResource, ApiGroup, RuleVerb, RoleRule, Role } from "../services/kubernetes";
import VerbChip from "./VerbChip";

type CreationDialogProps = {
    namespace: string;
    open: boolean;
    onClose: () => void;
    onSave: (role: Role) => void;
}

const RoleCreationDialog: NextPage<CreationDialogProps> = ({ namespace, open, onClose, onSave }) => {
    const [ selectedResourceType, setSelectedResourceType ] = useState<ApiResource | "">("");
    const [ selectedApi, setSelectedApi ] = useState<ApiGroup | "">("");
    const [ allowedVerbs, setAllowedVerbs ] = useState<RuleVerb []>([]);
    const [ selectedVerbs, setSelectedVerbs ] = useState<RuleVerb []>([]);
    const [ rules, setRules ] = useState<RoleRule []>([]);
    const [ roleName, setRoleName ] = useState<string>("");

    const fetcher = (...args: any []) => fetch(...args).then(res => res.json());
    const data: {api: ApiGroup, resources: ApiResource []} [] = useSWR("/api/kubernetes/api-resources", fetcher).data;

    const onResourceTypeChange = ($event: SelectChangeEvent) => {
        const group = data.find(group => group.resources.findIndex(({name}) => name === $event.target.value) !== -1)!;
        const resource = group.resources.find(resource => resource.name === $event.target.value)!;
        setSelectedResourceType(resource);
        setSelectedApi(group.api);
        setAllowedVerbs(resource.verbs);
    }

    const addRole = () => {
        setRules([...rules, {
            apiGroups: [ (selectedApi as ApiGroup).name ],
            resources: [ (selectedResourceType as ApiResource).name ],
            verbs: selectedVerbs
        }]);
        setSelectedApi("");
        setSelectedResourceType("");
        setSelectedVerbs([]);
        setAllowedVerbs([]);
    }

    const deleteRule = (index: number) => {
        setRules([
            ...rules.slice(0, index),
            ...rules.slice(index + 1)
        ]);
    }

    const saveRole = () => {
        const role: Role = {
            metadata: {
                name: roleName,
                namespace
            },
            rules
        };
        onSave(role);
        onClose();
    }

    const resourceSort = (firstEl: ApiResource, secondEl: ApiResource) => {
        const firstName = firstEl.kind,
              secondName = secondEl.kind;
        if (firstName < secondName) {
            return -1;
        }
        if (firstName > secondName) {
            return 1;
        }
        return 0;
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth={true}>
            <DialogTitle>Create new role</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Create a new role by filling the following form.
                </DialogContentText>
                {!!data &&
                <Box component="form" sx={{ "& > :not(style)": { m: 1 }}} noValidate autoComplete="off">
                    <TextField label="Role name" variant="outlined" value={roleName} onChange={($event) => setRoleName($event.target.value)} />
                    <TextField label="Namespace" variant="outlined" disabled value={namespace} />
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Resource type</TableCell>
                                    <TableCell>API Group</TableCell>
                                    <TableCell>Verbs</TableCell>
                                    <TableCell padding="checkbox"></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell>
                                        <Select style={{ width: "100%" }} onChange={onResourceTypeChange} value={(selectedResourceType as ApiResource).name || ""}>
                                            {data.flatMap(({ resources }) => resources)
                                                 .sort(resourceSort)
                                                 .map((resource, index) => (
                                                <MenuItem key={index} value={resource.name}>{resource.kind} ({resource.name})</MenuItem>
                                            ))}
                                        </Select>
                                    </TableCell>
                                    <TableCell>
                                        <Select style={{ width: "100%" }} disabled value={selectedApi !== "" ? selectedApi.preferredVersion.groupVersion : ""}>
                                            {data.map(({ api }, index) => (
                                                <MenuItem key={index} value={api.preferredVersion.groupVersion}>{api.name} ({api.preferredVersion.version})</MenuItem>
                                            ))}
                                        </Select>
                                    </TableCell>
                                    <TableCell>
                                        <Select multiple
                                                style={{ width: "100%" }}
                                                value={selectedVerbs}
                                                onChange={($event) => setSelectedVerbs([...$event.target.value as RuleVerb []])}
                                                disabled={selectedResourceType === ""}
                                                renderValue={(selected: RuleVerb []) => (
                                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                                {selected.map((verb) => (
                                                    <VerbChip key={verb} verb={verb} />
                                                ))}
                                            </Box>
                                        )}>
                                            {allowedVerbs.map(verb => (
                                                <MenuItem key={verb} value={verb}>{verb}</MenuItem>
                                            ))}
                                        </Select>
                                    </TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => addRole()} disabled={selectedResourceType === "" || selectedVerbs.length === 0}>
                                            <Add />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                                {rules.map((rule, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{rule.resources[0]}</TableCell>
                                        <TableCell>{rule.apiGroups[0]}</TableCell>
                                        <TableCell>
                                            <Stack direction="row" spacing={1}>
                                                {rule.verbs.map(verb => (
                                                    <VerbChip key={verb} verb={verb} />
                                                ))}
                                            </Stack>
                                        </TableCell>
                                        <TableCell>
                                            <IconButton onClick={() => deleteRule(index)}>
                                                <Delete />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <ButtonGroup>
                        <Button color="primary" disabled={roleName === "" || rules.length === 0} onClick={() => saveRole()}>Save</Button>
                        <Button color="error" onClick={onClose}>Close</Button>
                    </ButtonGroup>
                </Box>
                }
            </DialogContent>
        </Dialog>
    );
}

export default RoleCreationDialog;