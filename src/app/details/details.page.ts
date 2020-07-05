import { Component, OnInit } from '@angular/core';
import { EventsService } from '../events.service';
import { NavController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { EventResponse, EmergencyEvent, Acknowledgement } from '../interfaces';

@Component({
  selector: 'app-details',
  templateUrl: './details.page.html',
  styleUrls: ['./details.page.scss'],
})
export class DetailsPage implements OnInit {
  eventId: number;
  eventResponse: EventResponse;
  event: EmergencyEvent;
  acknowledgements: Acknowledgement[] = [];
  newNote = '';

  constructor(
    private route: ActivatedRoute,
    private eventService: EventsService,
    private nav: NavController
  ) { }

  async ngOnInit() {
    this.eventId = +this.route.snapshot.params['eventId'];
    this.eventResponse = await this.eventService.getById(this.eventId).toPromise();
    this.event = this.eventResponse.event;
    console.log(this.event);
    this.acknowledgements = await this.eventService.getAcknowledgements(this.eventResponse).toPromise();
  }

}
