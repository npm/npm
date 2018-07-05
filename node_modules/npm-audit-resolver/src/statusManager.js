const resolutionState = require('./resolutionState');


module.exports = {
    addStatus(action) {
        let unresolved = false;
        action.resolves.map(re => {
            const status = resolutionState.get({ id: re.id, path: re.path });
            if(status){
                re.humanReviewStatus = status
                if(status.remind && Date.now()>status.remind){
                    unresolved = true
                }
                if(status.fix){
                    // should have been fixed!
                    unresolved = true
                }
            } else {
                unresolved = true
            }
            return re;
        });
        action.humanReviewComplete = !unresolved
        return action
    }
};
