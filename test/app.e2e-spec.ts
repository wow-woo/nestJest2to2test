import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { AppModule } from './../src/app.module';
import { INestApplication } from '@nestjs/common';
import {  getConnection } from 'typeorm';

describe('App (e2e)', () => {
  let app: INestApplication;
  
  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async()=>{
    await getConnection().dropDatabase()
    await app.close()
  })
  // request(app.getHttpServer()).post(GQL_URL).send({
  //   mutation: `{
  //       createPodcast(
  //         input: {
  //           title: "this is a podcast", 
  //           category: "action"
  //       }) 
  //       {
  //         id
  //         ok
  //         error  
  //       }
  //   }`
  // })

  const GQL_URL = '/graphql'
  let podcastId:number;
  describe('Podcasts Resolver', () => {

    describe('getAllPodcasts', ()=>{

      it('Should retrieve all podcasts successfully', async()=>{
        request(app.getHttpServer()).post(GQL_URL).send({
          query: `{
            getAllPodcasts{
              error
              ok
              podcasts{
                id
              }
            }
          }`
        }).expect(200).expect(res=>{
          // {"data":{"getAllPodcasts":{"error":null,"ok":true,"podcasts":[]}}}
          expect(res.body.data.getAllPodcasts.ok).toBe(true)
          expect(res.body.data.getAllPodcasts.error).toBe(null)
          expect(res.body.data.getAllPodcasts.podcasts).toEqual([])
        })
      })
    })

    describe('createPodcast', ()=>{
      it('Should Create a podcast successfully', async()=>{
        request(app.getHttpServer()).post(GQL_URL).send({
          mutation: `{
              createPodcast(
                input: {
                  title: "this is a podcast", 
                  category: "action"
              }) 
              {
                id
                ok
                error  
              }
          }`
        }).expect(res=>{
          // {"data":{"createPodcast":{"id":2,"ok":true,"error":null}}}
          podcastId = res.body.data.createPodcast.id
          expect(res.body.data.createPodcast.id).toBe(Number)
          expect(res.body.data.createPodcast.ok).toBe(true)
          expect(res.body.data.createPodcast.error).toBe(null)
        })
      })
    
      it('Should fail, if the same podcast already exists', async()=>{
        request(app.getHttpServer()).post(GQL_URL).send({
          mutation: `{
              createPodcast(
                input: {
                  title: "this is a podcast", 
                  category: "action"
              }) 
              {
                id
                ok
                error  
              }
          }`
        }).expect(res=>{
          // {"data":{"createPodcast":{"id":null,"ok":false,"error":"Internal server error occurred."}}}
          expect(res.body.data.createPodcast.id).toBe(null)
          expect(res.body.data.createPodcast.ok).toBe(false)
          expect(res.body.data.createPodcast.error).toBe("Internal server error occurred.")
        })
      })

    })
    
    describe('createEpisode', ()=>{
      it('Should create an episode successfully', async()=>{
        request(app.getHttpServer()).post(GQL_URL).send({
          mutation:`{
            createEpisode(input:{
              podcastId:${podcastId}
              title:"My first episode 2",
              category:"romance"
            }){
              error
              ok
              id
            }
          }`
        }).expect(200).expect(res=>{
          expect(res.body.data.createEpisode.id).toBe(Number)
          expect(res.body.data.createEpisode.ok).toBe(true)
          expect(res.body.data.createEpisode.error).toBe(null)
        })
      })

      it('Should fail, if NO podcast with the id exists', async()=>{
        request(app.getHttpServer()).post(GQL_URL).send({
          mutation:`{
            createEpisode(input:{
              podcastId:${podcastId + 1}
              title:"My first episode 2",
              category:"romance"
            }){
              error
              ok
              id
            }
          }`
        }).expect(200).expect(res=>{
          // {"data":{"createEpisode":{"error":"Podcast with id 2 not found","ok":false,"id":null}}}
          expect(res.body.data.createEpisode.ok).toBe(false)
          expect(res.body.data.createEpisode.error).toBe(`Podcast with id ${podcastId} not found`)
        })
      })

      it('Should fail, if same episode exists', async()=>{
        request(app.getHttpServer()).post(GQL_URL).send({
          mutation:`{
            createEpisode(input:{
              podcastId:${podcastId}
              title:"My first episode 2",
              category:"romance"
            }){
              error
              ok
              id
            }
          }`
        }).expect(200).expect(res=>{
          // {"data":{"createEpisode":{"error":"Same episode already exists","ok":false,"id":null}}}
          expect(res.body.data.createEpisode.ok).toBe(false)
          expect(res.body.data.createEpisode.error).toBe("Same episode already exists")
        })
      })

    });

    describe('getEpisodes', ()=>{

      it('Should retrieve episodes successfully', async()=>{
        request(app.getHttpServer()).post(GQL_URL).send({
          query: `{
            getEpisodes(input:{
              id:${podcastId}
            }){
              ok
              error
              episodes{
                id
              }
            }
          }`
        }).expect(200).expect(res=>{
          // {"data":{"getEpisodes":{"ok":true,"error":null,"episodes":[{"id":1}]
          expect(res.body.data.getEpisodes.ok).toBe(true)
          expect(res.body.data.getEpisodes.error).toBe(null)
          expect(res.body.data.getEpisodes.podcasts).toEqual([{"id":1}])
        })
      })

    })

    describe('updatePodcast', ()=>{
      it('Should update a podcast', async()=>{
        request(app.getHttpServer()).post(GQL_URL).send({
          mutation: `{
            updatePodcast(input:{
              id:${podcastId}
              payload:{
                title:"updated title"
              }
            }){
              ok
              error
            }
          }`
        }).expect(200).expect(res=>{
          // {"data":{"updatePodcast":{"ok":true,"error":null}}}
          expect(res.body.data.updatePodcast.ok).toBe(true)
          expect(res.body.data.updatePodcast.error).toBe(null)
        })
      })

      it('Should fail, if rating in payload is not between 1 and 5', async()=>{
        request(app.getHttpServer()).post(GQL_URL).send({
          mutation: `{
            updatePodcast(input:{
              id:1
              payload:{
                title:"updated title"
              }
            }){
              ok
              error
            }
            }`
          }).expect(200).expect(res=>{
            // {"data":{"updatePodcast":{"ok":false,"error":"Podcast with id 1 not found"}}}
            expect(res.body.data.updatePodcast.ok).toBe(false)
            expect(res.body.data.updatePodcast.error).toBe("Podcast with id 1 not found")
          })
      })
    })

    it.todo('updatePodcast');
    it.todo('updateEpisode');
    it.todo('deletePodcast');
    it.todo('deleteEpisode');
  });
  describe('Users Resolver', () => {
    it.todo('createAccount');
    it.todo('login');
    it.todo('me');
    it.todo('seeProfile');
    it.todo('editProfile');
  });
});
