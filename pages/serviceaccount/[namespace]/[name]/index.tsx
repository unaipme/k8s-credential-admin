import React, { Fragment, FunctionComponent, useState } from "react";
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
import ErrorablePage, { ErroredProps } from "../../../../components/ErrorPage";

type ServiceAccountInfoProps = {
    name: string;
    namespace: string;
    roles: { roleBinding: RoleBinding, role: Role } [];
    clusterroles: { roleBinding: RoleBinding, role: Role } [];
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
            <TableRow sx={{ "&>.MuiTableCell-root": { minWidth: "10%" }}}>
                <TableCell rowSpan={role.rules.length}>{roleBinding.metadata.name}</TableCell>
                <TableCell rowSpan={role.rules.length}>{role.metadata.name}</TableCell>
                <TableCell>
                    <code>{role.rules[0]?.resources[0]}</code>
                </TableCell>
                <TableCell>
                    <code>{!!role.rules[0]?.nonResourceURLs && role.rules[0]?.nonResourceURLs[0]}</code>
                </TableCell>
                <TableCell style={{ maxWidth: "20%" }}>
                    <Stack direction="row" spacing={1}>
                        {role.rules[0]?.verbs?.includes("*") ?
                            Object.keys(kubernetes.info.rbac.verbs).map(verb => (
                                <VerbChip key={verb} verb={verb as RuleVerb} />
                            ))
                        :
                            (role.rules[0]?.verbs || []).map(verb => (
                                <VerbChip key={verb} verb={verb} />
                            ))
                        }
                    </Stack>
                </TableCell>
            </TableRow>
            {role.rules.slice(1).map((rule, index) => (
                <TableRow key={index}>
                    <TableCell>
                        <code>{(rule.resources || [])[0]}</code>
                    </TableCell>
                    <TableCell>
                        <code>{(rule.nonResourceURLs || [])[0]}</code>
                    </TableCell>
                    <TableCell>
                        <Stack direction="row" spacing={1}>
                            {rule.verbs?.includes("*") ?
                                Object.keys(kubernetes.info.rbac.verbs).map(verb => (
                                    <VerbChip key={verb} verb={verb as RuleVerb} />
                                ))
                            :
                                (rule.verbs || []).map(verb => (
                                    <VerbChip key={verb} verb={verb} />
                                ))
                            }
                        </Stack>
                    </TableCell>
                </TableRow>
            ))}
        </>
    );
}

const ServiceAccountInfoComponent: FunctionComponent<ServiceAccountInfoProps> = ({ name, namespace, roles, clusterroles }) => {
    return (
        <div style={{ width: "50%" }}>
            <Head>
                <title>Service account {name}</title>
            </Head>
            <Typography variant="h6">
                Service account <code>{name}</code>{}
            </Typography>
            {roles.length === 0 && clusterroles.length === 0 ?
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
                            <TableCell>Non resource URLs</TableCell>
                            <TableCell>Verbs</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {roles.length > 0 &&
                            <>
                                <TableRow>
                                    <TableCell className="title-row" colSpan={5}>Roles</TableCell>
                                </TableRow>
                                {roles.map((row, index) => (
                                    <RoleBindingRow key={index} {...row} />
                                ))}
                            </>
                        }
                        {clusterroles.length > 0 &&
                            <>
                                <TableRow>
                                    <TableCell className="title-row" colSpan={5}>Cluster Roles</TableCell>
                                </TableRow>
                                {clusterroles.map((row, index) => (
                                    <RoleBindingRow key={index} {...row} />
                                ))}
                            </>
                        }
                    </TableBody>
                </Table>
            </TableContainer>
            }
            <div className="buttongroup-container">
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
        </div>
    )
}

const ServiceAccountInfo: NextPage<ErroredProps<ServiceAccountInfoProps>> = (props) => {
    return (
        <ErrorablePage {...props} >
            <ServiceAccountInfoComponent />
        </ErrorablePage>
    );
}

const getServerSideProps = async (context: NextPageContext) => {
    const name: string = context.query.name! as string;
    const namespace: string = context.query.namespace! as string;
    const roles = await firstValueFrom(kubernetes.getServiceAccountRoles(name, namespace));
    const clusterroles = await firstValueFrom(kubernetes.getServiceAccountClusterRoles(name));
    return {
        props: {
            namespace, name, roles, clusterroles
        }
    }
}

export { getServerSideProps };

export default ServiceAccountInfo;