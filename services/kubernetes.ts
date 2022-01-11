import https from "https";
import { Observable, from, concat, zip } from "rxjs";
import { filter, map, mergeAll, mergeMap, tap, toArray } from "rxjs/operators";

const token = process.env.TOKEN;
const api = `https://${process.env.KUBERNETES_SERVICE_HOST}:${process.env.KUBERNETES_SERVICE_PORT}`;

type Metadata = {
    name: string;
    namespace: string;
    [key:string]: any;
}

type ServiceAccount = {
    apiVersion?: string;
    automountServiceAccountToken?: boolean;
    kind?: string;
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

type RuleVerb = "create" | "get" | "list" | "watch" | "update" | "patch" | "delete" | "deletecollection" | "*";

type RoleRule = {
    apiGroups: string [];
    resources: string [];
    nonResourceURLs: string [];
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

type ApiGrouping = {
    api: ApiGroup;
    resources: ApiResource [];
};

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
        fetch(`${api}/${url}`, fullOptions).then(response => {
            response.json()
                    .then(data => {
                        if (!!data && (!data.code || (data.code >= 200 && data.code <= 399))) {
                            resolve(data);
                        } else {
                            console.error("Rejecting response even though it was correctly retrieved from", url, data);
                            reject(data);
                        }
                    }).catch(err => {
                        console.error("Caught error when obtaining JSON body from", url, err);
                        reject(err);
                    })
        }).catch(err => {
            console.error("Caught error when fetching from", url, err);
            reject(err);
        });
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
    getServiceAccountClusterRoleBindings(serviceAccount: string): Observable<RoleBinding []> {
        return f<RoleBinding []>(`apis/rbac.authorization.k8s.io/v1/clusterrolebindings`).pipe(
            map((response: any) => response.items as RoleBinding []),
            map(items => items.filter(crb =>
                !!crb.subjects && crb.subjects.some(sub => sub.kind === "ServiceAccount" && sub.name === serviceAccount)
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
            toArray(),
        );
    },
    getServiceAccountClusterRoles(serviceAccount: string): Observable<{ roleBinding: RoleBinding, role: Role } []> {
        return this.getServiceAccountClusterRoleBindings(serviceAccount).pipe(
            mergeAll(),
            mergeMap((roleBinding: RoleBinding) => this.getClusterRoles().pipe(
                mergeAll(),
                filter((role: Role) => roleBinding.roleRef.name === role.metadata.name),
                map((role: Role) => ({ roleBinding, role }))
            )),
            toArray(),
        );
    },
    getNamespaceRoles(namespace: string): Observable<Role []> {
        return f(`apis/rbac.authorization.k8s.io/v1/namespaces/${namespace}/roles`).pipe(
            map((response: any) => response.items as Role [])
        );
    },
    getClusterRoles(): Observable<Role []> {
        return f(`apis/rbac.authorization.k8s.io/v1/clusterroles`).pipe(
            map((response: any) => response.items)
        );
    },
    getApis(): Observable<ApiGroup []> {
        return f("apis");
    },
    getApiResourceTypes(api: ApiGroup): Observable<ApiResourceList> {
        return f(`apis/${api.preferredVersion.groupVersion}`);
    },
    getAllApiResourceTypes(): Observable<ApiGrouping []> {
        return this.getApis().pipe(
            map((response: any) => response.groups as ApiGroup []),
            mergeAll(),
            mergeMap(api => this.getApiResourceTypes(api).pipe(
                map(({ resources }) => ({ api, resources }))
            )),
            toArray(),
            map((resources: ApiGrouping []) => resources.sort((a: ApiGrouping, b: ApiGrouping) => {
                if (a.api.name < b.api.name) {
                    return -1;
                } else if (a.api.name > b.api.name) {
                    return 1;
                }
                return 0;
            }))
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
    createServiceAccount(serviceAccount: ServiceAccount): Observable<any> {
        return f(`api/v1/namespaces/${serviceAccount.metadata.namespace}/serviceaccounts`, {
            method: "POST",
            body: JSON.stringify(serviceAccount)
        });
    },
    info: {
        rbac: {
            verbs: ({
                create: "Permission to create a new instance of the selected resource",
                get: "Permission to get information of one specific instance of a resource",
                list: "Permission to retrieve a list of all instances of a specific resource",
                watch: "Permission to watch live changes on instances of a specific resource",
                update: "Permission to create a replacement of an already existing instance of a specific resource",
                patch: "Permission to alter the configuration of an already existing instance of a specific resource",
                delete: "Permission to delete instances of a specific resource",
                deletecollection: "Permission to delete collections of instances of a specific resource"
            } as { [verb in RuleVerb]: string })

        }
    }
};

export default kubernetes;

export type {
    ApiResource,
    ApiGroup,
    ApiGrouping,
    ApiGroupVersion,
    ServiceAccount,
    RoleBinding,
    RoleRule,
    RuleVerb,
    Role
};