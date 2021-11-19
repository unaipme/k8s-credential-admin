import { NextPage, NextPageContext } from "next";
import Head from 'next/head';
import kubernetes, { RoleBinding } from "../../../services/kubernetes";
import { firstValueFrom } from "rxjs";

type ServiceAccountInfoProps = {
    name: string;
    namespace: string;
    rolebindings: RoleBinding [];
}

const ServiceAccountInfo: NextPage<ServiceAccountInfoProps> = ({ name, namespace, rolebindings }) => {
    const noRoleBinding = (
        <div>
            No role bindings for service account {name}
        </div>
    );

    const roleBindingList = (
        <div>
            {rolebindings.map(({ roleRef }, index) => (
                <p key={index}>{roleRef.kind} {roleRef.name}</p>
            ))}
        </div>
    )

    return (
        <div>
            <Head>
                <title>Service account {name}</title>
            </Head>
            <p>{namespace}::{name}</p>
            {rolebindings.length === 0 ? noRoleBinding : roleBindingList}
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