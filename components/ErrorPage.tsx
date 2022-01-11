import { Paper, Table, TableBody, TableCell, TableContainer, TableRow, Typography } from "@mui/material";
import { Component, FunctionComponent, PropsWithChildren, Children, isValidElement, cloneElement } from "react";

const ErrorPage: FunctionComponent<{ error: any }> = ({ error }) => {
    return (
        <div style={{ textAlign: "center" }}>
            <Typography>An error happenned</Typography>
            <TableContainer component={Paper}>
                <Table>
                    <TableBody>
                        {Object.entries(error).map(([key, val], index) => {
                            const value: any = typeof val === "object" ? JSON.stringify(val) : val;
                            return (
                                <TableRow key={key}>
                                    <TableCell style={{ fontWeight: "bold" }}>{key}</TableCell>
                                    <TableCell align="right">{value}</TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    )
}

type ErroredProps<T> = PropsWithChildren<T & {
    error: any
}>;

export default ErrorPage;

export type { ErroredProps };