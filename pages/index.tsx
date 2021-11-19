import type { NextPage } from 'next'
import Link from "next/link";
import Head from 'next/head';
import kubernetes, { ServiceAccount } from '../services/kubernetes';
import { firstValueFrom } from "rxjs";
import { List, ListItem, ListItemButton, ListItemIcon, ListItemText, ListSubheader, Button } from "@mui/material";
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import AddIcon from '@mui/icons-material/Add';

const unique = <T,>(elements: T []): T [] => {
  return elements.filter((value, index, self) => self.indexOf(value) === index);
}

type HomeProps = {
  serviceAccounts: ServiceAccount [];
}

const Home: NextPage<HomeProps> = ({ serviceAccounts }) => {
  const namespaces = unique(serviceAccounts.map(sa => sa.metadata.namespace));
  return (
    <div style={{ height: "100%" }}>
      <Head>
        <title>Prueba</title>
      </Head>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", border: "1px solid blue", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button startIcon={<AddIcon />}>New service account</Button>
        </div>
        <div style={{ border: "1px solid red", width: "50%", maxHeight: "50%", overflowY: "auto" }}>
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
                    <Link key={`${namespace}-${sa.metadata.name}`} href={`/serviceaccount/${namespace}/${sa.metadata.name}`}>
                      <ListItem>
                        <ListItemButton>
                          <ListItemText primary={sa.metadata.name} />
                          <ListItemIcon>
                            <ArrowForwardIosIcon />
                          </ListItemIcon>
                        </ListItemButton>
                      </ListItem>
                    </Link>
                  ))}
                </ul>
              </li>
            ))}
          </List>
        </div>
      </div>
    </div>
  )
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

export default Home
