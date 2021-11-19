import React from 'react'
import Link from "next/link";
import { List, ListItem, ListItemButton, ListItemIcon, ListItemText, Paper } from '@mui/material'
import type { NextPage } from 'next'
import { ArrowForwardIos } from '@mui/icons-material'

const Home: NextPage = () => {
  return (
    <div style={{ height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div style={{ width: "50%" }}>
        <Paper>
          <List>
            <Link href="/serviceaccount">
              <ListItem disablePadding>
                <ListItemButton>
                  <ListItemText>Manage service accounts</ListItemText>
                  <ListItemIcon>
                    <ArrowForwardIos />
                  </ListItemIcon>
                </ListItemButton>
              </ListItem>
            </Link>
          </List>
        </Paper>
      </div>
    </div>
  )
}

export default Home
