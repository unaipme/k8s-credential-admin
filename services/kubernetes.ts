import https from "https";
import { Observable, from } from "rxjs";
import { filter, map, mergeAll, mergeMap, pluck, tap, toArray } from "rxjs/operators";

const token = process.env.TOKEN;
const api = `https://${process.env.KUBERNETES_SERVICE_HOST}:${process.env.KUBERNETES_SERVICE_PORT}`;

type Metadata = {
    name: string;
    namespace: string;
    [key:string]: any;
}

type ServiceAccount = {
    apiVersion: string;
    automountServiceAccountToken: boolean;
    imagePullSecrets: {
        name: string;
    } [];
    kind: string;
    secrets: any [];
    metadata: Metadata;
}

type RoleBinding = {
    metadata: Metadata;
    roleRef: {
        apiGroup: string;
        kind: string;
        name: string;
    },
    subjects: {
        apiGroup?: string;
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
    metadata: Metadata;
    rules: RoleRule [];
}

type ApiGroupVersion = {
    groupVersion: string;
    version: string;
};

type ApiGroup = {
    name: string;
    versions: ApiGroupVersion [];
    preferredVersion: ApiGroupVersion;
}

type ApiResource = {
    name: string;
    singularName: string;
    namespaced: boolean;
    kind: string;
    verbs: RuleVerb [];
    shortNames: string [];
}

type ApiResourceList = {
    resources: ApiResource [];
}

const agent = new https.Agent({
    rejectUnauthorized: false
});

const f = <T,>(url: string, options?: RequestInit): Observable<T> => {
    return from(new Promise<T>((resolve, reject) => {
        const fullOptions = {
            ...options,
            agent,
            headers: {
                ...options?.headers,
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        };
        // console.log("Fetching", url, fullOptions);
        fetch(`${api}/${url}`, fullOptions).then(response => {
            response.json().then(data => resolve(data)).catch(err => reject(err))
        }).catch(err => reject(err));
    }));
}

const kubernetes = {
    getAllServiceAccounts(): Observable<ServiceAccount []> {
        return f("api/v1/serviceaccounts").pipe(
            map((response: any) => response.items as ServiceAccount [])
        );
    },
    getNamespacedServiceAccounts(namespace: string): Observable<ServiceAccount []> {
        return f(`api/v1/namespaces/${namespace}/serviceaccounts`).pipe(
            map((response: any) => response.items as ServiceAccount [])
        );
    },
    getServiceAccountRoleBindings(serviceAccount: string, namespace: string): Observable<RoleBinding []> {
        return f<RoleBinding []>(`apis/rbac.authorization.k8s.io/v1/namespaces/${namespace}/rolebindings`).pipe(
            map((response: any) => response.items as RoleBinding []),
            map(items => items.filter(rb =>
                rb.subjects.some(sub => sub.kind === "ServiceAccount" && sub.name === serviceAccount)
            ))
        );
    },
    getServiceAccountRoles(serviceAccount: string, namespace: string): Observable<{ roleBinding: RoleBinding, role: Role } []> {
        return this.getServiceAccountRoleBindings(serviceAccount, namespace).pipe(
            mergeAll(),
            mergeMap((roleBinding: RoleBinding) => this.getNamespaceRoles(namespace).pipe(
                mergeAll(),
                filter((role: Role) => roleBinding.roleRef.name === role.metadata.name),
                map((role: Role) => ({ roleBinding, role }))
            )),
            toArray()
        );
    },
    getNamespaceRoles(namespace: string): Observable<Role []> {
        return f(`apis/rbac.authorization.k8s.io/v1/namespaces/${namespace}/roles`).pipe(
            map((response: any) => response.items as Role [])
        );
    },
    getApis(): Observable<ApiGroup []> {
        return f("apis");
    },
    getApiResourceTypes(api: ApiGroup): Observable<ApiResourceList> {
        return f(`apis/${api.preferredVersion.groupVersion}`);
    },
    getAllApiResourceTypes(): Observable<{api: ApiGroup, resources: ApiResource []} []> {
        return this.getApis().pipe(
            map((response: any) => response.groups as ApiGroup []),
            mergeAll(),
            mergeMap(api => this.getApiResourceTypes(api).pipe(
                map(({ resources }) => ({ api, resources }))
            )),
            toArray(),
        )
    },
    createRole(role: Role): Observable<any> {
        return f(`apis/rbac.authorization.k8s.io/v1/namespaces/${role.metadata.namespace}/roles`, {
            method: "POST",
            body: JSON.stringify(role)
        });
    },
    deleteRole(role: Role): Observable<any> {
        return f(`apis/rbac.authorization.k8s.io/v1/namespaces/${role.metadata.namespace}/roles/${role.metadata.name}`, {
            method: "DELETE",
            body: JSON.stringify(role)
        });
    },
    updateRole(role: Role): Observable<any> {
        return f(`apis/rbac.authorization.k8s.io/v1/namespaces/${role.metadata.namespace}/roles/${role.metadata.name}`, {
            method: "PUT",
            body: JSON.stringify(role)
        });
    },
    createRoleBinding(roleBinding: RoleBinding): Observable<any> {
        return f(`apis/rbac.authorization.k8s.io/v1/namespaces/${roleBinding.metadata.namespace}/rolebindings`, {
            method: "POST",
            body: JSON.stringify(roleBinding)
        });
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
    ApiResource,
    ApiGroup,
    ApiGroupVersion,
    ServiceAccount,
    RoleBinding,
    RoleRule,
    RuleVerb,
    Role
};