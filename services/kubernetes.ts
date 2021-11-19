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

type RuleVerb = "list" | "get" | "watch" | "create" | "delete";

type RoleRule = {
    apiGroups: string [];
    resources: string [];
    verbs: RuleVerb [];
};

type Role = {
    metadata: any;
    rules: RoleRule [];
}

const agent = new https.Agent({
    rejectUnauthorized: false
});

const f = <T,>(url: string, options?: RequestInit): Observable<T> => {
    return from(new Promise<T>((resolve, reject) => {
        fetch(`${api}/${url}`, {
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
        return f("api/v1/serviceaccounts");
    },
    getNamespacedServiceAccounts(namespace: string): Observable<ServiceAccount []> {
        return f(`api/v1/namespaces/${namespace}/serviceaccounts`);
    },
    getServiceAccountRoleBindings(serviceAccount: string, namespace: string): Observable<RoleBinding []> {
        return f<RoleBinding []>(`apis/rbac.authorization.k8s.io/v1/namespaces/${namespace}/rolebindings`).pipe(
            map(items => items.filter(rb =>
                rb.subjects.some(sub => sub.kind === "ServiceAccount" && sub.name === serviceAccount)
            ))
        );
    },
    getNamespaceRoles(namespace: string): Observable<Role []> {
        return f(`apis/rbac.authorization.k8s.io/v1/namespaces/${namespace}/roles`);
    },
    info: {
        rbac: {
            verbs: {
                create: "Permission to create a new instance of the selected resource",
                get: "Permission to get information of one specific instance of a resource",
                list: "Permission to retrieve a list of all instances of a specific resource",
                watch: "Permission to watch live changes on instances of a specific resource",
                update: "Permission to create a replacement of an already existing instance of a specific resource",
                patch: "Permission to alter the configuration of an already existing instance of a specific resource",
                delete: "Permission to delete instances of a specific resource",
                deletecollection: "Permission to delete collections of instances of a specific resource"
            }

        }
    }
};

export default kubernetes;

export type {
    ServiceAccount,
    RoleBinding,
    RoleRule,
    RuleVerb,
    Role
};