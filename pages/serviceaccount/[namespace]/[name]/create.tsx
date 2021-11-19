import React, { FunctionComponent, useState } from "react";
import { NextPage, NextPageContext } from "next";
import { firstValueFrom } from "rxjs";
import kubernetes, { Role, RoleRule, RuleVerb } from "../../../../services/kubernetes";
import { Box, Button, Checkbox, Chip, Collapse, Divider, IconButton, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography } from "@mui/material";
import { Add, KeyboardArrowUp, KeyboardArrowDown } from "@mui/icons-material";

type CreateRoleBindingProps = {
    namespace: string;
    name: string;
    existingRoles: Role [];
}

type GroupedRules = {
    [apiGroup: string]: {
        name: string;
        verbs: RuleVerb [];
    } [];
}

const groupRoleRules = (rules: RoleRule []): GroupedRules => {
    const groups: GroupedRules = {};
    for (let rule of rules) {
        const verbs = rule.verbs;
        const resources = rule.resources.map(name => ({
            name, verbs
        }));
        for (let apiGroup of rule.apiGroups) {
            groups[apiGroup] = [...groups[apiGroup] || [], ...resources];
        }
    }
    return groups;
}

type ExistingRoleRowProps = {
    role: Role;
    onRoleSelect: (role: Role) => void;
}

const ExistingRoleRow: FunctionComponent<ExistingRoleRowProps> = ({ role, onRoleSelect }) => {
    const [ open, setOpen ] = useState(false);
    return (
        <>
            <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                <TableCell padding="checkbox">
                    <IconButton size="small" onClick={() => setOpen(!open)}>
                        { open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                    </IconButton>
                </TableCell>
                <TableCell padding="checkbox">
                    <Checkbox onChange={() => onRoleSelect(role)} />
                </TableCell>
                <TableCell component="th" scope="row">
                    {role.metadata.name}
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={3}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 1 }}>
                            <Typography variant="h6" gutterBottom component="div">
                                Resources and permissions
                            </Typography>
                            <Table size="small" aria-label="purchases">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>API Group</TableCell>
                                        <TableCell>Name</TableCell>
                                        <TableCell>Verbs</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                {Object.entries(groupRoleRules(role.rules)).map(([apiGroup, resources]) => 
                                    resources.map(({ name, verbs }, index) => (
                                        <TableRow key={name}>
                                            { index === 0 &&
                                            <TableCell rowSpan={resources.length}>
                                                <code>{apiGroup === "" ? "core" : apiGroup}</code>
                                            </TableCell>
                                            }
                                            <TableCell component="th" scope="row">
                                                <code>{ name }</code>
                                            </TableCell>
                                            <TableCell>
                                                <Stack direction="row" spacing={1}>
                                                    {verbs.map(verb => (
                                                        <Tooltip key={verb} title={kubernetes.info.rbac.verbs[verb]}>
                                                            <Chip label={verb} style={{ cursor: "help" }} />
                                                        </Tooltip>
                                                    ))}
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    )
                                ))}
                                </TableBody>
                            </Table>
                        </Box>
                    </Collapse>
                    
                </TableCell>
            </TableRow>
        </>
    )
}

const CreateRoleBinding: NextPage<CreateRoleBindingProps> = ({ namespace, name, existingRoles }) => {
    const [ selected, select ] = useState<Role []>([]);

    const onRoleSelect = (role: Role) => {
        if (selected.includes(role)) {
            const index = selected.findIndex(r => r === role);
            select([...selected.slice(0, index), ...selected.slice(index + 1)]);
        } else {
            select([...selected, role]);
        }
        console.log(selected);
    }

    return (
        <div>
            <Typography variant="h4">Create role binding</Typography>
            <Divider />
            <Box>
                <Typography variant="h5">Create a new role</Typography>
                <Button startIcon={<Add />}>Create</Button>
            </Box>
            <Divider />
            <Box>
                <Typography variant="h5">Use existing roles</Typography>
                {existingRoles.length > 0 ?
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell />
                                    <TableCell />
                                    <TableCell>Role name</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                            {existingRoles.map(role => (
                                <ExistingRoleRow key={role.metadata.name} role={role} onRoleSelect={onRoleSelect} />
                            ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    :
                    <div>
                        No pre-existing roles were found in namespace {namespace}
                    </div>
                }
            </Box>
        </div>
    )
}

const getServerSideProps = async (context: NextPageContext) => {
    const { namespace, name } = context.query;
    const existingRoles = await firstValueFrom(kubernetes.getNamespaceRoles(namespace));
    return {
        props: { namespace, name, existingRoles }
    }
}

export {
    getServerSideProps
};

export default CreateRoleBinding;