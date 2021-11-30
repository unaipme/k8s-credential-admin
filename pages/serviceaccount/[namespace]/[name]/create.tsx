import React, { FunctionComponent, useState } from "react";
import { NextPage, NextPageContext } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { firstValueFrom } from "rxjs";
import kubernetes, { Role, RoleBinding, RoleRule, RuleVerb } from "../../../../services/kubernetes";
import {
    Box,
    Button,
    ButtonGroup,
    Checkbox,
    Collapse,
    Divider,
    IconButton,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Toolbar,
    Typography
} from "@mui/material";
import { Add, ArrowBack, Delete, Edit, KeyboardArrowUp, KeyboardArrowDown, Save } from "@mui/icons-material";
import VerbChip from "../../../../components/VerbChip";
import RoleDialog from "../../../../components/RoleDialog";

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
    onSelect: (role: Role) => void;
    onDelete: (role: Role) => void;
    onEdit: (role: Role) => void;
}

const ExistingRoleRow: FunctionComponent<ExistingRoleRowProps> = ({ role, onSelect, onDelete, onEdit }) => {
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
                    <Checkbox onChange={() => onSelect(role)} />
                </TableCell>
                <TableCell component="th" scope="row">
                    {role.metadata.name}
                </TableCell>
                <TableCell padding="checkbox">
                    <IconButton onClick={() => onEdit(role)}>
                        <Edit />
                    </IconButton>
                </TableCell>
                <TableCell padding="checkbox">
                    <IconButton onClick={() => onDelete(role)}>
                        <Delete />
                    </IconButton>
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
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
                                                        <VerbChip key={verb} verb={verb} />
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
    const [ roleBinding, setRoleBinding ] = useState<RoleBinding>({
        metadata: {
            name: "",
            namespace
        },
        roleRef: {
            apiGroup: "rbac.authorization.k8s.io",
            kind: "Role",
            name: ""
        },
        subjects: [{
            kind: "ServiceAccount",
            name,
            namespace
        }]
    })
    const [ dialogOpen, setDialogOpen ] = useState<boolean>(false);
    const [ roles, setRoles ] = useState<Role []>(existingRoles);
    const [ editedRole, setEditedRole ] = useState<Role | undefined>();

    const router = useRouter();

    const onRoleSelect = (role: Role) => {
        if (roleBinding.roleRef.name === "") {
            setRoleBinding({
                ...roleBinding,
                roleRef: {
                    ...roleBinding.roleRef,
                    name: (role.metadata.name as string)
                }
            });
        } else {
            setRoleBinding({
                ...roleBinding,
                roleRef: {
                    ...roleBinding.roleRef,
                    name: ""
                }
            });
        }
    }

    const saveRole = (role: Role) => {
        const index = roles.findIndex(r => r.metadata.name === role.metadata.name);
        if (index === -1) {
            setRoles([
                ...roles,
                role
            ]);
        } else {
            setRoles([
                ...roles.slice(0, index),
                role,
                ...roles.slice(index + 1)
            ]);
        }
    };

    const deleteRole = (role: Role) => {
        const index = roles.findIndex(r => role === r);
        fetch("/api/kubernetes/roles", {
            method: "DELETE",
            body: JSON.stringify(role)
        }).then(() => {
            setRoles([
                ...roles.slice(0, index),
                ...roles.slice(index + 1)
            ]);
        }).catch((err) => console.log("DELETE ERROR", err));
    }

    const editRole = (role: Role) => {
        console.log("EDITING", role);
        setEditedRole(role);
    }

    const createRoleBinding = () => {
        fetch("/api/kubernetes/rolebindings", {
            method: "POST",
            body: JSON.stringify(roleBinding)
        }).then(() => {
            router.push(`/serviceaccount/${namespace}/${name}`);
        }).catch(err => console.log("ERROR!", err));
    }

    const setRoleBindingName = (name: string) => {
        setRoleBinding({
            ...roleBinding,
            metadata: {
                ...roleBinding.metadata,
                name
            }
        })
    }

    return (
        <div style={{ width: "50%" }}>
            {!!dialogOpen ?
            <RoleDialog open={true} onClose={() => setDialogOpen(false)} onSave={saveRole} namespace={namespace} />
            :
            !!editedRole &&
            <RoleDialog open={true} onClose={() => setEditedRole(undefined)} onSave={saveRole} initialRole={editedRole!} />
            }
            <Box>
                <div style={{ float: "right" }}>
                
                </div>
                <Toolbar sx={{ 
                    pl: { sm: 2 },
                    pr: { xs: 1, sm: 1 }
                }}>
                    <Typography variant="h6" component="div" sx={{ flex: "1 1 100%" }}>
                        Create role binding for service account { name }
                    </Typography>
                </Toolbar>
                <Box component="form" sx={{ "& > :not(style)": { m: 1, width: "25ch" } }} noValidate autoComplete="off">
                    <TextField label="Name" variant="outlined" onChange={($event) => setRoleBindingName($event.target.value)} />
                    <TextField label="Namespace" disabled value={namespace} variant="outlined" />
                </Box>
                <Divider />
                <Toolbar sx={{
                    pl: { sm: 2 },
                    pr: { xs: 1, sm: 1 },
                }}>
                    <Typography sx={{ flex: "1 1 100%" }}>
                        Choose or create roles to bind to
                    </Typography>
                    <Button variant="outlined" onClick={() => setDialogOpen(true)} startIcon={<Add />}>Create role</Button>
                </Toolbar>
                {roles.length > 0 ?
                    <>
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell />
                                        <TableCell />
                                        <TableCell>Role name</TableCell>
                                        <TableCell></TableCell>
                                        <TableCell></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                {roles.map(role => (
                                    <ExistingRoleRow key={role.metadata.name}
                                                    role={role}
                                                    onSelect={onRoleSelect}
                                                    onDelete={deleteRole}
                                                    onEdit={editRole} />
                                ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <div className="buttongroup-container">
                            <ButtonGroup>
                                <Button disabled={roleBinding.roleRef.name === "" || roleBinding.metadata.name === ""}
                                        startIcon={<Save />}
                                        onClick={() => createRoleBinding()}>
                                    Create
                                </Button>
                                <Link href={`/serviceaccount/${namespace}/${name}`} passHref>
                                    <Button color="error" startIcon={<ArrowBack />}>Go back</Button>
                                </Link>
                            </ButtonGroup>
                        </div>
                    </>
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
    const existingRoles = await firstValueFrom(kubernetes.getNamespaceRoles(namespace as string));
    return {
        props: { namespace, name, existingRoles }
    }
}

export {
    getServerSideProps
};

export default CreateRoleBinding;