import { Button, List, ListItem, ListItemButton, ListSubheader, ListItemText, ListItemIcon, Paper } from "@mui/material";
import Link from "next/link";
import { NextPage } from "next";
import { Add, ArrowForwardIos } from "@mui/icons-material";
import React from "react";
import kubernetes, { ServiceAccount } from "../../services/kubernetes";
import { firstValueFrom } from "rxjs";


const unique = <T,>(elements: T []): T [] => {
    return elements.filter((value, index, self) => self.indexOf(value) === index);
}
  
type HomeProps = {
    serviceAccounts: ServiceAccount [];
}

const ServiceAccountPage: NextPage<HomeProps> = ({ serviceAccounts }) => {
    
    const namespaces = unique(serviceAccounts.map(sa => sa.metadata.namespace));

    return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", width: "50%", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "flex-end", width: "100%" }}>
                <Button startIcon={<Add />}>New service account</Button>
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
  const serviceAccounts = await firstValueFrom(kubernetes.getAllServiceAccounts());
  return {
    props: {
      serviceAccounts
    }
  }
}

export { getServerSideProps };

export default ServiceAccountPage;