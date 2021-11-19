import { NextPage, NextPageContext } from "next";
import Head from 'next/head';
import Link from "next/link";
import kubernetes, { RoleBinding } from "../../../../services/kubernetes";
import { firstValueFrom } from "rxjs";
import { Button, ButtonGroup } from "@mui/material";
import{ Add, ArrowBack } from "@mui/icons-material";

type ServiceAccountInfoProps = {
    name: string;
    namespace: string;
    rolebindings: RoleBinding [];
}

const ServiceAccountInfo: NextPage<ServiceAccountInfoProps> = ({ name, namespace, rolebindings }) => {
    return (
        <div>
            <Head>
                <title>Service account {name}</title>
            </Head>
            <p>{namespace}::{name}</p>
            {rolebindings.length === 0 ?
            <div>
                No role bindings for service account {name}
            </div>
            :
            <div>
                {rolebindings.map(({ roleRef }, index) => (
                    <p key={index}>{roleRef.kind} {roleRef.name}</p>
                ))}
            </div>}
            <ButtonGroup>
                <Link href={`/serviceaccount/${namespace}/${name}/create`}>
                    <Button startIcon={<Add />}>
                        Create role binding
                    </Button>
                </Link>
                <Link href="/serviceaccount">
                    <Button startIcon={<ArrowBack />} color="error">
                        Go back
                    </Button>
                </Link>
            </ButtonGroup>
        </div>
    )
}

const getServerSideProps = async (context: NextPageContext) => {
    const { namespace, name } = context.query;
    const rolebindings = await firstValueFrom(kubernetes.getServiceAccountRoleBindings(name, namespace));
    return {
        props: {
            namespace, name, rolebindings
        }
    }
}

export { getServerSideProps };

export default ServiceAccountInfo;