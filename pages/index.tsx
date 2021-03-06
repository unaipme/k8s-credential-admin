import React from 'react'
import Link from "next/link";
import { List, ListItem, ListItemButton, ListItemIcon, ListItemText, Paper } from '@mui/material'
import type { NextPage } from 'next'
import { ArrowForwardIos } from '@mui/icons-material'

const Home: NextPage = () => {
  return (
    <div style={{ display: "flex", width: "50%" }}>
      <div style={{ width: "100%" }}>
        <Paper>
          <List>
            <Link href="/serviceaccount" passHref>
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
