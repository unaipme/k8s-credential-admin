import React, { Fragment, useState } from "react";
import { NextPage, NextPageContext } from "next";
import Head from 'next/head';
import Link from "next/link";
import kubernetes, { Role, RoleBinding, RoleRule, RuleVerb } from "../../../../services/kubernetes";
import { firstValueFrom } from "rxjs";
import {
    Alert,
    Button,
    ButtonGroup,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
} from "@mui/material";
import{ Add, ArrowBack, KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
import useSWR from "swr";
import VerbChip from "../../../../components/VerbChip";

type ServiceAccountInfoProps = {
    name: string;
    namespace: string;
    roles: { roleBinding: RoleBinding, role: Role } [];
}

type RoleBindingRowProps = {
    roleBinding: RoleBinding;
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

const RoleBindingRow: React.FunctionComponent<{ roleBinding: RoleBinding, role: Role }> = ({ roleBinding, role }) => {
    return (
        <>
            <TableRow>
                <TableCell rowSpan={role.rules.length}>{roleBinding.metadata.name}</TableCell>
                <TableCell rowSpan={role.rules.length}>{role.metadata.name}</TableCell>
                <TableCell>
                    <code>{role.rules[0]?.resources[0]}</code>
                </TableCell>
                <TableCell>
                    <Stack direction="row" spacing={1}>
                        {(role.rules[0]?.verbs || []).map(verb => (
                            <VerbChip key={verb} verb={verb} />
                        ))}
                    </Stack>
                </TableCell>
            </TableRow>
            {role.rules.slice(1).map((rule, index) => (
                <TableRow key={index}>
                    <TableCell>
                        <code>{rule.resources[0]}</code>
                    </TableCell>
                    <TableCell>
                        <Stack direction="row" spacing={1}>
                            {(rule.verbs || []).map(verb => (
                                <VerbChip key={verb} verb={verb} />
                            ))}
                        </Stack>
                    </TableCell>
                </TableRow>
            ))}
        </>
    );
}

const ServiceAccountInfo: NextPage<ServiceAccountInfoProps> = ({ name, namespace, roles }) => {
    return (
        <div style={{ width: "50%" }}>
            <Head>
                <title>Service account {name}</title>
            </Head>
            <Typography variant="h6">
                Service account <code>{name}</code>{}
            </Typography>
            {roles.length === 0 ?
            <Alert severity="info">
                No role bindings for service account {name}
            </Alert>
            :
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Role binding</TableCell>
                            <TableCell>Role</TableCell>
                            <TableCell>Resource type</TableCell>
                            <TableCell>Verbs</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {roles.map((row, index) => (
                            <RoleBindingRow key={index} {...row} />
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            }
            <ButtonGroup>
                <Link href={`/serviceaccount/${namespace}/${name}/create`} passHref>
                    <Button startIcon={<Add />}>
                        Create role binding
                    </Button>
                </Link>
                <Link href="/serviceaccount" passHref>
                    <Button startIcon={<ArrowBack />} color="error">
                        Go back
                    </Button>
                </Link>
            </ButtonGroup>
        </div>
    )
}

const getServerSideProps = async (context: NextPageContext) => {
    const name: string = context.query.name! as string;
    const namespace: string = context.query.namespace! as string;
    const roles = await firstValueFrom(kubernetes.getServiceAccountRoles(name, namespace));
    return {
        props: {
            namespace, name, roles
        }
    }
}

export { getServerSideProps };

export default ServiceAccountInfo;