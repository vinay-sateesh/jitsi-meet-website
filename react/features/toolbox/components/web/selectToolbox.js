import React from 'react'
import ToolboxParticipant from './ToolboxParticipant'
import Toolbox from './Toolbox'

const selectToolbox = (roomName, localParticipant) => {
    switch (localParticipant.role) {

        case 'moderator':
            return <Toolbox />
        default:
            return <ToolboxParticipant roomName={roomName} localParticipant={localParticipant} />
    }
}

export default selectToolbox;