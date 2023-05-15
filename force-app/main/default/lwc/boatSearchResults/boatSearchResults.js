import { LightningElement, api, wire } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getBoats from '@salesforce/apex/BoatDataService.getBoats';
import updateBoatList from '@salesforce/apex/BoatDataService.updateBoatList';

import { publish, MessageContext } from 'lightning/messageService';
import BOATMC from '@salesforce/messageChannel/BoatMessageChannel__c';

const SUCCESS_TITLE = 'Success';
const MESSAGE_SHIP_IT = 'Ship it!';
const SUCCESS_VARIANT = 'success';
const ERROR_TITLE = 'Error';
const ERROR_VARIANT = 'error';

export default class BoatSearchResults extends LightningElement {
    selectedBoatId;
    columns = [
        { label: 'Name', fieldName: 'Name', editable: true },
        { label: 'Length', fieldName: 'Length__c', type: 'number', editable: true },
        { label: 'Price', fieldName: 'Price__c', type: 'currency', editable: true },
        { label: 'Description ', fieldName: 'Description__c', editable: true },
    ];
    @api boatTypeId;
    boats;
    @api isLoading = false;

    @wire(MessageContext)
    messageContext;


    @wire(getBoats, { boatTypeId: '$boatTypeId' })
    wiredBoats({ error, data }) {
        if (data) {
            this.boats = data;
        }
        else {
            console.log(error);
        }

        this.notifyLoading(false);
    }

    // public function that updates the existing boatTypeId property
    // uses notifyLoading
    @api
    searchBoats(boatTypeId) {
        this.notifyLoading(true);
        this.boatTypeId = boatTypeId;
    }

    @api
    async refresh() {
        this.notifyLoading(false);
        return refreshApex(this.boats);
    }

    updateSelectedTile(event) {
        this.selectedBoatId = event.detail.boatId;
        this.sendMessageService(this.selectedBoatId);
    }

    sendMessageService(boatId) {
        publish(this.messageContext, BOATMC, { recordId: boatId })
    }

    handleSave(event) {
        this.notifyLoading(true);
        const updatedFields = event.detail.draftValues;
        updateBoatList({ data: updatedFields })
            .then(() => {
                this.dispatchEvent(new ShowToastEvent({
                    variant: SUCCESS_VARIANT,
                    title: SUCCESS_TITLE,
                    message: MESSAGE_SHIP_IT
                }));
            })
            .catch(error => {
                this.dispatchEvent(new ShowToastEvent({
                    variant: ERROR_VARIANT,
                    title: ERROR_TITLE,
                    message: error
                }));
            })
            .finally(() => {
                this.refresh();
            });
    }

    notifyLoading(isLoading) {
        if (isLoading) {
            this.dispatchEvent(new CustomEvent('loading'));
        }
        else {
            this.dispatchEvent(new CustomEvent('doneloading'));
        }
    }
}