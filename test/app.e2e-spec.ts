import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { AppModule } from './../src/app.module';
import { INestApplication } from '@nestjs/common';
import { getConnection } from 'typeorm';

describe('App (e2e)', () => {
  let app: INestApplication;
  let request_supertest;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    request_supertest = ()=>request(app.getHttpServer()).post('/graphql')
    await app.init();
  });

  afterAll(async()=>{
    await getConnection().dropDatabase()
    await app.close()
  })

  describe('Podcasts Resolver', () => {
    let podcastId :number
    let episodeId :number

    describe('1. createPodcast', ()=>{
      it('Should create a podcast', ()=>{
        return request_supertest().send({
          query:`mutation{
            createPodcast(input:{
              title:"this is a podcast",
              category:"action"
            }){
              id
              ok
              error
            }
          }`
        }).expect(200).expect(res=>{
          expect(res.body.data.createPodcast.ok).toBe(true)
          expect(res.body.data.createPodcast.error).toBe(null)
          expect(res.body.data.createPodcast.id).toEqual(expect.any(Number))
          podcastId = res.body.data.createPodcast.id
        })
      })
    })

    describe('2. createEpisode', ()=>{
      it('Should create an episode successfully', ()=>{
        return request_supertest().send({
          query:`mutation{
            createEpisode(input:{
              podcastId:${podcastId}
              title:"My first episode 10"
              category:"romance"    
              }){
              error
              ok
              id
            }
          }`
        }).expect(200).expect(res=>{
          expect(res.body).toEqual({"data": {"createEpisode": {"error": 
          null, "id": expect.any(Number), "ok": true}}})

          episodeId = res.body.data.createEpisode.id
        })
      })

      it('Should fail to create an episode', ()=>{
        return request_supertest().send({
          query:`mutation{
            createEpisode(input:{
              podcastId:${podcastId + 1}
              title:"My first episode 10"
              category:"romance"    
              }){
              error
              ok
              id
            }
          }`
        }).expect(200).expect(res=>{
          expect(res.body).toEqual({"data": {"createEpisode": {"error": 
          `Podcast with id ${podcastId+1} not found`, "id": null, "ok": false }}})
        })
      })
    })

    describe('3. getPodcast', ()=>{
      it('Should retrieve a podcast successfully', ()=>{
        return request_supertest().send({
          query:`{
            getPodcast(input:{
              id:${podcastId}
            }){
              ok
              error
              podcast{
                id
              }
            }
          }`
        }).expect(200).expect(res=>{
          expect(res.body).toEqual({"data": {"getPodcast": {"error": 
          null, "ok": true, "podcast":{ id: podcastId}}}})
        })
      })

      it('Should fail to retrieve a podcast', ()=>{
        return request_supertest().send({
          query:`{
            getPodcast(input:{
              id:${podcastId+1}
            }){
              ok
              error
              podcast{
                id
              }
            }
          }`
        }).expect(200).expect(res=>{
          expect(res.body).toEqual({"data": {"getPodcast": {"error": 
          `Podcast with id ${podcastId+1} not found`, "ok": false, "podcast": null }}})
        })
      })
    })

    describe('4. getAllPodcasts', ()=>{
      it('Should retrieve all podcasts successfully', ()=>{
        return request_supertest().send({
          query:`{
            getAllPodcasts{
              ok
              error
              podcasts{
                id
              }
            }
          }`
        }).expect(200).expect(res=>{
          expect(res.body).toEqual({"data": {"getAllPodcasts": {"error": 
          null, "ok": true, "podcasts":[{ id: podcastId}] }}})
        })
      })
    })

    describe('5. getEpisodes', ()=>{
      it('Should retrieve all Episodes successfully', ()=>{
        return request_supertest().send({
          query:`{
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
          expect(res.body).toEqual({"data": {"getEpisodes": {"error": 
          null, "ok": true, "episodes":[{ id: episodeId}] }}})
        })
      })

      it('Should fail to retrieve all Episodes', ()=>{
        return request_supertest().send({
          query:`{
            getEpisodes(input:{
              id:${podcastId+1}
            }){
              ok
              error
              episodes{
                id
              }
            }
          }`
        }).expect(200).expect(res=>{
          expect(res.body).toEqual({"data": {"getEpisodes": {"error": 
          `Podcast with id ${podcastId+1} not found`, "ok": false, "episodes": null }}})
        })
      })
    })

    describe('6. updatePodcast', ()=>{
      it('Should update a podcast successfully', ()=>{
        return request_supertest().send({
          query:`mutation{
            updatePodcast(input:{
              id:${podcastId}
              payload:{
                title:"updated title"
                rating:3
              }
            }){
              ok
              error
            }
          }`
        }).expect(200).expect(res=>{
          expect(res.body).toEqual({"data": {"updatePodcast": {"error": 
          null, "ok": true }}})
        })
      })

      it('Should fail to update a podcast', ()=>{
        return request_supertest().send({
          query:`mutation{
            updatePodcast(input:{
              id:${podcastId+1}
              payload:{
                title:"updated title"
                rating:3
              }
            }){
              ok
              error
            }
          }`
        }).expect(200).expect(res=>{
          expect(res.body).toEqual({"data": {"updatePodcast": {"error": 
          `Podcast with id ${podcastId+1} not found`, "ok": false }}})
        })
      })

      it('Should fail to update a podcast, due to rating value', ()=>{
        return request_supertest().send({
          query:`mutation{
            updatePodcast(input:{
              id:${podcastId}
              payload:{
                title:"updated title"
                rating:999
              }
            }){
              ok
              error
            }
          }`
        }).expect(200).expect(res=>{
          expect(res.body).toEqual({"data": {"updatePodcast": {"error": 
          "Rating must be between 1 and 5.", "ok": false }}})
        })
      })
    })
    
    describe('7. updateEpisode', ()=>{
      it('Should update an episode successfully', ()=>{
        return request_supertest().send({
          query:`mutation{
            updateEpisode(input:{
              podcastId: ${podcastId}
              episodeId: ${episodeId}
                category:"haha"
                title:"Changed"
            }){
              ok
              error
            }
          }`
        }).expect(200).expect(res=>{
          expect(res.body).toEqual({"data": {"updateEpisode": {"error": 
          null, "ok": true }}})
        })
      })

      it('Should fail to update an episode', ()=>{
        return request_supertest().send({
          query:`mutation{
            updateEpisode(input:{
              podcastId: ${podcastId+1}
              episodeId: ${episodeId+1}
              category:"update category"
              title:"update title"
            }){
              ok
              error
            }
          }`
        }).expect(200).expect(res=>{
          expect(res.body).toEqual({"data": {"updateEpisode": {"error": 
          `Podcast with id ${podcastId+1} not found`, "ok": false }}})
        })
      })
    })

    describe('8. deleteEpisode', ()=>{
      it('Should delete an episode successfully', ()=>{
        return request_supertest().send({
          query:`mutation{
            deleteEpisode(input:{
            podcastId:${podcastId}
            episodeId:${episodeId}
          }){
            error
          }
          }`
        }).expect(200).expect(res=>{
          expect(res.body).toEqual({"data": {"deleteEpisode": {"error": 
          null }}})
        })
      })

      it('Should fail to delete an episode', ()=>{
        return request_supertest().send({
          query:`mutation{
            deleteEpisode(input:{
            podcastId:${podcastId+1}
            episodeId:${episodeId+1}
          }){
            error
          }
          }`
        }).expect(200).expect(res=>{
          expect(res.body).toEqual({"data": {"deleteEpisode": {"error": 
          `Podcast with id ${podcastId+1} not found` }}})
        })
      })
    })
    
    describe('9. deletePodcast', ()=>{
      it('Should delete a podcast successfully', ()=>{
        return request_supertest().send({
          query:`mutation{
            deletePodcast(input:{
              id:${podcastId}
            }){
              ok
              error
            }
          }`
        }).expect(200).expect(res=>{
          expect(res.body).toEqual({"data": {"deletePodcast": {"error": 
          null, "ok": true }}})
        })
      })

      it('Should fail to delete a podcast', ()=>{
        return request_supertest().send({
          query:`mutation{
            deletePodcast(input:{
              id:${podcastId+1}
            }){
              ok
              error
            }
          }`
        }).expect(200).expect(res=>{
          expect(res.body).toEqual({"data": {"deletePodcast": {"error": 
          "Podcast with id 2 not found", "ok": false }}})
        })
      })
    })

  });

  describe('Users Resolver', () => {
    let email:string = "email@email.com"
    let password:string = "thisispassword"
    let token:string
    let accountId:number

    describe('1. createAccount', ()=>{
      it('Should create account successfully', ()=>{
        return request_supertest().send({
          query:`mutation{
            createAccount(input:{
              email:"${email}"
              password:"${password}"
              role:Listener
            }){
              ok
              error
            }
          }`
        }).expect(200).expect(res=>{
          expect(res.body).toEqual({"data": {"createAccount": {"error": null, "ok": true}}})
        })
      })

      it('Should fail to create account', ()=>{
        return request_supertest().send({
          query:`mutation{
            createAccount(input:{
              email:"${email}"
              password:"${password}"
              role:Listener
            }){
              ok
              error
            }
          }`
        }).expect(200).expect(res=>{
          expect(res.body).toEqual({"data": {"createAccount": {"error": "There is a user with that email already", "ok": false}}})
        })
      })
    });

    describe('2. login', ()=>{
      it('Should log in successfully', ()=>{
        return request_supertest().send({
          query:`mutation{
            login(input:{
              email:"${email}"
              password:"${password}"
            }){
              ok
              error
              token
            }
            }`
        }).expect(200).expect(res=>{
          expect(res.body).toEqual({"data": {"login": {"error": null, "ok": 
          true, "token": expect.any(String)}}})
          token = res.body.data.login.token
        })
      })

      it('Should fail to log in', ()=>{
        return request_supertest().send({
          query:`mutation{
            login(input:{
              email:"${email+'oop'}"
              password:"${password+'oop'}"
            }){
              ok
              error
              token
            }
            }`
        }).expect(200).expect(res=>{
          expect(res.body).toEqual({"data": {"login": {"error": "User not found", "ok": 
          false, "token": null }}})
        })
      })
    });

    describe('3. me', ()=>{
      it('Should retrieve me successfully', ()=>{
        return request_supertest().send({
          query:`{
            me{
              id
              email
              role
            }
          }`
        }).set('x-jwt', token).expect(200).expect(res=>{
          expect(res.body).toEqual({"data": {"me": {"email": "email@email.com", "id": expect.any(Number), "role": "Listener"}}})
          accountId = res.body.data.me.id
        })
      })

      it('Should fail to retrieve me', ()=>{
        return request_supertest().send({
          query:`{
            me{
              id
              email
              role
            }
          }`
        }).set('x-jwt', "wrongToken").expect(200).expect(res=>{
          expect(res?.body?.data).toBe(null)
          expect(res?.body?.errors[0]?.extensions?.exception?.message).toBe("Forbidden resource")
        })
      })
    });

    describe('4. seeProfile', ()=>{
      it('Should see a profile successfully', ()=>{
        return request_supertest().send({
          query:`{
            seeProfile(userId:${accountId}){
              ok
              error
              user{
                id
                email
              }
            }
          }`
        }).set('x-jwt', token).expect(200).expect(res=>{
          expect(res.body).toEqual({"data": {"seeProfile": {"error": null, "ok": true, "user": {"email": "email@email.com", "id": accountId}}}})
        })
      })

      it('Should fail to see a profile', ()=>{
        return request_supertest().send({
          query:`{
            seeProfile(userId:${accountId+1}){
              ok
              error
              user{
                id
                email
              }
            }
          }`
        }).set('x-jwt', token).expect(200).expect(res=>{
          expect(res.body).toEqual({"data": {"seeProfile": {"error": "User Not Found", "ok": false, "user": null }}})
        })
      })
    });

    describe('5. editProfile', ()=>{
      it('Should change email successfully', ()=>{
        return request_supertest().send({
          query:`mutation{
            editProfile(input:{
                email:"newemail@email.com"
            }){
              ok
              error
            }
            }`
        }).set('x-jwt', token).expect(200).expect(res=>{
          expect(res.body).toEqual({"data": {"editProfile": {"error": null, 
          "ok": true}}})
        })
      })

      it('Should change password successfully', ()=>{
        return request_supertest().send({
          query:`mutation{
            editProfile(input:{
                password:"newpassword"
            }){
              ok
              error
            }
            }`
        }).set('x-jwt', token).expect(200).expect(res=>{
          expect(res.body).toEqual({"data": {"editProfile": {"error": null, 
          "ok": true}}})
        })
      })

      it('Should have new email successfully', ()=>{
        return request_supertest().send({
          query:`mutation{
            editProfile(input:{
                email:"newemail@email.com"
            }){
              ok
              error
            }
            }`
        }).set('x-jwt', token).expect(200).expect(res=>{
          expect(res.body).toEqual({"data": {"editProfile": {"error": null, 
          "ok": true}}})
        }).then(()=>{
          return request_supertest().send({
            query:`{
              me{
                id
                email
                role
              }
            }`
          }).set('x-jwt', token).expect(200).expect(res=>{
            expect(res.body).toEqual({"data": {"me": {"email": "newemail@email.com", "id": expect.any(Number), "role": "Listener"}}})
            accountId = res.body.data.me.id
          })
        })
      })

      
    });

  });
});
