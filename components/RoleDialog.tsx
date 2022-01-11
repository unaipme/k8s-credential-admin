import { Add, Delete, Save, Cancel } from "@mui/icons-material";
import {
    Box,
    Button,
    ButtonGroup,
    Dialog,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton,
    ListSubheader,
    MenuItem,
    Paper,
    Select,
    SelectChangeEvent,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import React, { useState, Fragment, FunctionComponent } from "react";
import { ApiResource, ApiGroup, ApiGrouping, RuleVerb, Role } from "../services/kubernetes";
import VerbChip from "./VerbChip";

type CreationDialogProps = {
    apiResources: ApiGrouping [];
    namespace?: string;
    initialRole?: Role;
    open: boolean;
    onClose: () => void;
    onSave: (role: Role) => void;
}

const RoleDialog: FunctionComponent<CreationDialogProps> = ({ apiResources, namespace, initialRole, open, onClose, onSave }) => {
    const [ role, setRole ] = useState<Role>(initialRole || {
        metadata: {
            namespace: namespace!,
            name: ""
        },
        rules: []
    });

    const [ loading, setLoading ] = useState<boolean>(false);
    const [ selectedResourceType, setSelectedResourceType ] = useState<ApiResource | "">("");
    const [ selectedApi, setSelectedApi ] = useState<ApiGroup | "">("");
    const [ allowedVerbs, setAllowedVerbs ] = useState<RuleVerb []>([]);
    const [ selectedVerbs, setSelectedVerbs ] = useState<RuleVerb []>([]);

    const onResourceTypeChange = ($event: SelectChangeEvent) => {
        const group = apiResources.find(group => group.resources.findIndex(({name}) => name === $event.target.value) !== -1)!;
        const resource = group.resources.find(resource => resource.name === $event.target.value)!;
        setSelectedResourceType(resource);
        setSelectedApi(group.api);
        setAllowedVerbs(resource.verbs);
    }

    const addRole = () => {
        setRole({
            ...role,
            rules: [
                ...role.rules,
                {
                    apiGroups: [ (selectedApi as ApiGroup).name ],
                    resources: [ (selectedResourceType as ApiResource).name ],
                    nonResourceURLs: [],
                    verbs: selectedVerbs
                }
            ]
        });
        setSelectedApi("");
        setSelectedResourceType("");
        setSelectedVerbs([]);
        setAllowedVerbs([]);
    }

    const deleteRule = (index: number) => {
        setRole({
            ...role,
            rules: [
                ...role.rules.slice(0, index),
                ...role.rules.slice(index + 1)
            ]
        });
    }

    const saveRole = () => {
        setLoading(true);
        let promise;
        if (!!initialRole) {
            promise = fetch("/api/kubernetes/roles", {
                method: "PUT",
                body: JSON.stringify(role)
            });
        } else {
            promise = fetch("/api/kubernetes/roles", {
                method: "POST",
                body: JSON.stringify(role)
            });
        }
        promise.then(() => {
            onSave(role);
            onClose();
        }).catch(err => console.log("ERROR", err))
        .finally(() => setLoading(false));
    }

    const setRoleName = (name: string) => {
        setRole({
            ...role,
            metadata: {
                ...role.metadata,
                name
            }
        });
    }

    const verbDelete = (role: Role, ruleIndex: number, verb: RuleVerb) => {
        const rule = role.rules[ruleIndex];
        const verbs = rule.verbs.filter(v => v !== verb);
        if (verbs.length === 0) {
            setRole({
                ...role,
                rules: [
                    ...role.rules.slice(0, ruleIndex),
                    ...role.rules.slice(ruleIndex + 1)
                ]
            });
        } else {
            setRole({
                ...role,
                rules: [
                    ...role.rules.slice(0, ruleIndex),
                    {
                        ...rule,
                        verbs
                    },
                    ...role.rules.slice(ruleIndex + 1)
                ]
            });
        }
    }

    const _namespace = role?.metadata?.namespace || namespace || "default";
    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth={true}>
            <DialogTitle>Create new role</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Create a new role by filling the following form.
                </DialogContentText>
                <Box component="form" sx={{ "& > :not(style)": { m: 1 }}} noValidate autoComplete="off">
                    <TextField label="Role name"
                               variant="outlined"
                               value={role.metadata.name}
                               onChange={($event) => setRoleName($event.target.value)} />
                    <TextField label="Namespace" variant="outlined" disabled value={_namespace} />
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
                                            {apiResources.map(({ api, resources }, index) => (
                                                <Fragment key={index}>
                                                    <ListSubheader>{api.name}</ListSubheader>
                                                    {resources.map((resource, resourceIndex) => (
                                                        <MenuItem key={resourceIndex} value={resource.name}>
                                                            {resource.kind} (<code>{resource.name}</code>)
                                                        </MenuItem>
                                                    ))}
                                                </Fragment>
                                            ))}
                                        </Select>
                                    </TableCell>
                                    <TableCell>
                                        <Select style={{ width: "100%" }} disabled value={selectedApi !== "" ? selectedApi.preferredVersion.groupVersion : ""}>
                                            {apiResources.map(({ api }, index) => (
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
                                {role.rules.map((rule, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{rule.resources[0]}</TableCell>
                                        <TableCell>{rule.apiGroups[0]}</TableCell>
                                        <TableCell>
                                            <Stack direction="row" spacing={1}>
                                                {rule.verbs.map(verb => (
                                                    <VerbChip key={verb} verb={verb} onDelete={() => verbDelete(role, index, verb)} />
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
                        <LoadingButton loading={loading}
                                       color="primary"
                                       variant="outlined"
                                       startIcon={<Save />}
                                       disabled={role.metadata.name === "" || role.rules.length === 0}
                                       onClick={() => saveRole()}>
                                           Save
                        </LoadingButton>
                        <Button color="error" onClick={onClose} disabled={loading} startIcon={<Cancel />}>Close</Button>
                    </ButtonGroup>
                </Box>
            </DialogContent>
        </Dialog>
    );
}

export default RoleDialog;