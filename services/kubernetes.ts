import https from "https";
import { Observable, from } from "rxjs";
import { map } from "rxjs/operators";

const token = process.env.TOKEN;
const api = `https://${process.env.KUBERNETES_SERVICE_HOST}:${process.env.KUBERNETES_SERVICE_PORT}`;

type ServiceAccount = {
    apiVersion: string;
    automountServiceAccountToken: boolean;
    imagePullSecrets: {
        name: string;
    } [];
    kind: string;
    secrets: any [];
    metadata: any;
}

type RoleBinding = {
    metadata: any;
    roleRef: {
        apiGroup: string;
        kind: string;
        name: string;
    },
    subjects: {
        apiGroup: string;
        kind: string;
        name: string;
        namespace: string;
    } [];
}

const agent = new https.Agent({
    rejectUnauthorized: false
});

const f = <T,>(url: string, options?: RequestInit): Observable<T> => {
    return from(new Promise<T>((resolve, reject) => {
        fetch(url, {
            ...options,
            agent,
            headers: {
                ...options?.headers,
                "Authorization": `Bearer ${token}`
            }
        }).then(response => {
            response.json().then(data => resolve(data.items)).catch(err => reject(err))
        }).catch(err => reject(err));
    }));
}

const kubernetes = {
    getAllServiceAccounts(): Observable<ServiceAccount []> {
        return f(`${api}/api/v1/serviceaccounts`);
    },
    getNamespacedServiceAccounts(namespace: string): Observable<ServiceAccount []> {
        return f(`${api}/api/v1/namespaces/${namespace}/serviceaccounts`);
    },
    getServiceAccountRoleBindings(serviceAccount: string, namespace: string): Observable<RoleBinding []> {
        return f<RoleBinding []>(`${api}/apis/rbac.authorization.k8s.io/v1/namespaces/${namespace}/rolebindings`).pipe(
            map(items => items.filter(rb =>
                rb.subjects.some(sub => sub.kind === "ServiceAccount" && sub.name === serviceAccount)
            ))
        );
    }
};

export default kubernetes;

export type {
    ServiceAccount,
    RoleBinding
};