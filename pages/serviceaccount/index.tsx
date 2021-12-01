import {
    Box,
    Button,
    ButtonGroup,
    Dialog,
    DialogTitle,
    DialogContent,
    Grid,
    List,
    ListItem,
    ListItemButton,
    ListSubheader,
    ListItemText,
    ListItemIcon,
    MenuItem,
    Paper,
    TextField,
    Select,
    FormControl,
    InputLabel
} from "@mui/material";
import Link from "next/link";
import { NextPage } from "next";
import { Add, ArrowForwardIos, Cancel, Save } from "@mui/icons-material";
import React, { FunctionComponent, useState } from "react";
import kubernetes, { ServiceAccount } from "../../services/kubernetes";
import { firstValueFrom } from "rxjs";
import { LoadingButton } from "@mui/lab";


const unique = <T,>(elements: T []): T [] => {
    return elements.filter((value, index, self) => self.indexOf(value) === index);
}
  
type ServiceAccountPageProps = {
    existingServiceAccounts: ServiceAccount [];
}

type ServiceAccountCreationDialogProps = {
    open: boolean;
    onClose: () => void;
    onCreate: (serviceAccount: ServiceAccount) => void;
    namespaces: string [];
}

const ServiceAccountCreationDialog: FunctionComponent<ServiceAccountCreationDialogProps> = ({ open, onClose, onCreate, namespaces }) => {
    const [ loading, setLoading ] = useState<boolean>(false);
    const [ serviceAccount, setServiceAccount ] = useState<ServiceAccount>({
        metadata: {
            name: "",
            namespace: ""
        },
        secrets: []
    });

    const updateName = (name: string) => {
        setServiceAccount({
            ...serviceAccount,
            metadata: {
                ...serviceAccount.metadata,
                name
            }
        })
    }

    const updateNamespace = (namespace: string) => {
        setServiceAccount({
            ...serviceAccount,
            metadata: {
                ...serviceAccount.metadata,
                namespace
            }
        })
    }

    const saveServiceAccount = () => {
        setLoading(true);
        fetch("/api/kubernetes/serviceaccounts", {
            method: "POST",
            body: JSON.stringify(serviceAccount)
        }).then(() => {
            onCreate(serviceAccount);
            onClose();
        }).catch((err) => {
            console.log("error", err);
        }).finally(() => setLoading(false));
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Create new service account</DialogTitle>
            <DialogContent>
                Create a new service account by filling the following form
            </DialogContent>
            <Box component="form"
                 sx={{
                     m: 1,
                    "& > .MuiFormControl-root": { mt: 1, mb: 1 },
                    "& > .MuiButtonGroup-root": { mt: 1, mb: 1 },
                 }}
                 noValidate
                 autoComplete="off">
                <FormControl component="div" fullWidth>
                    <TextField label="Name"
                            variant="outlined"
                            value={serviceAccount.metadata.name}
                            onChange={($event) => updateName($event.target.value)} />
                </FormControl>
                <FormControl component="div" fullWidth>
                    <InputLabel id="new-service-account-namespace-label">Namespace</InputLabel>
                    <Select labelId="new-service-account-namespace-label"
                            label="Namespace"
                            onChange={($event) => updateNamespace($event.target.value as string)}
                            placeholder="Namespace">
                        {namespaces.map(namespace => 
                            <MenuItem key={namespace} value={namespace}>{namespace}</MenuItem>
                            )}
                    </Select>
                </FormControl>
                <ButtonGroup>
                    <LoadingButton startIcon={<Save />}
                            variant="outlined"
                            loading={loading}
                            onClick={saveServiceAccount}
                            disabled={serviceAccount.metadata.name === "" || serviceAccount.metadata.namespace === ""}>
                                Save
                            </LoadingButton>
                    <Button startIcon={<Cancel />} color="error" onClick={onClose}>Close</Button>
                </ButtonGroup>
            </Box>
        </Dialog>
    )
}

const ServiceAccountPage: NextPage<ServiceAccountPageProps> = ({ existingServiceAccounts }) => {
    const [ serviceAccounts, setServiceAccounts ] = useState<ServiceAccount []>(existingServiceAccounts)
    const [ dialogOpen, setDialogOpen ] = useState<boolean>(false);
    const namespaces = unique((serviceAccounts || []).map(sa => sa.metadata.namespace));

    const onServiceAccountCreate = (serviceAccount: ServiceAccount) => {
        setServiceAccounts([
            ...serviceAccounts,
            serviceAccount
        ])
    }

    return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", width: "50%", flexDirection: "column" }}>
            <ServiceAccountCreationDialog open={dialogOpen}
                                          namespaces={namespaces}
                                          onClose={() => setDialogOpen(false)}
                                          onCreate={onServiceAccountCreate} />
            <div style={{ display: "flex", justifyContent: "flex-end", width: "100%" }}>
                <Button startIcon={<Add />} onClick={() => setDialogOpen(true)}>New service account</Button>
            </div>
            <div style={{ width: "100%", maxHeight: "50%" }}>
                <Paper style={{ maxHeight: "100%", overflowY: "auto" }}>
                    <List
                        sx={{
                        width: '100%',
                        '& ul': { padding: 0 },
                        '& li': { paddingTop: 0, paddingBottom: 0 }
                        }}
                        subheader={<li />}
                    >
                        {namespaces.map((namespace) => (
                        <li key={namespace}>
                            <ul>
                            <ListSubheader>{namespace}</ListSubheader>
                            {serviceAccounts.filter(sa => sa.metadata.namespace === namespace).map((sa) => (
                                <Link key={`${namespace}-${sa.metadata.name}`} href={`/serviceaccount/${namespace}/${sa.metadata.name}`} passHref>
                                <ListItem>
                                    <ListItemButton>
                                        <ListItemText primary={sa.metadata.name} />
                                        <ListItemIcon>
                                            <ArrowForwardIos />
                                        </ListItemIcon>
                                    </ListItemButton>
                                </ListItem>
                                </Link>
                            ))}
                            </ul>
                        </li>
                        ))}
                    </List>
                </Paper>
            </div>
        </div>
    );
}

const getServerSideProps = async () => {
  const existingServiceAccounts = await firstValueFrom(kubernetes.getAllServiceAccounts());
  return {
    props: { existingServiceAccounts }
  }
}

export { getServerSideProps };

export default ServiceAccountPage;