import { Paper, Table, TableBody, TableCell, TableContainer, TableRow, Typography } from "@mui/material";
import { Component, FunctionComponent, PropsWithChildren, Children, isValidElement, cloneElement } from "react";

const ErrorPage: FunctionComponent<{ error: any }> = ({ error }) => {
    return (
        <div style={{ textAlign: "center" }}>
            <Typography>An error happenned</Typography>
            <TableContainer component={Paper}>
                <Table>
                    <TableBody>
                        {Object.entries(error).map(([key, value], index) => (
                            <TableRow key={key}>
                                <TableCell style={{ fontWeight: "bold" }}>{key}</TableCell>
                                <TableCell align="right">{typeof value === "object" ? JSON.stringify(value) : value}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    )
}

type ErroredProps<T> = PropsWithChildren<T & {
    error: any
}>;

class ErrorablePage<T> extends Component<ErroredProps<T>> {
    render() {
        if (!!this.props.error) {
            return <ErrorPage error={this.props.error} />
        } else {
            return Children.map(this.props.children, child => {
                if (isValidElement(child)) {
                    return cloneElement(child, { ...this.props });
                }
                return child;
            });
        }
    }
}

export default ErrorablePage;

export type { ErroredProps };