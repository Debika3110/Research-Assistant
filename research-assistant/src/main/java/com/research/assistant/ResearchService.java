package com.research.assistant;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.*;

@Service
public class ResearchService {
    @Value("${gemini.api.url}")
    private String geminiApiUrl;
    @Value("${gemini.api.key}")
    private String geminiApiKey;

    private final WebClient webClinet;
    private final ObjectMapper objectMapper;



    public ResearchService(WebClient.Builder webClinetBuilder,ObjectMapper objectMapper) {
        this.webClinet = webClinetBuilder.build();
        this.objectMapper=objectMapper;
    }

    public String processContent(ResearchRequest request) {
        //build pompt
        String prompt=buildPrompt(request);
        //Query the Ai Model Api
        Map<String,Object> requestBody=Map.of(
                "contents",new Object[]{
                        Map.of("parts",new Object[]{
                                Map.of("text",prompt)
                        })
                }
        );
        String response=webClinet.post()
                .uri(geminiApiUrl+geminiApiKey)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .block();
        //parse the response
        //Return response
        return extractTextFromResponse(response);
    }

    private String extractTextFromResponse(String response) {
        try{
            GeminiResponse geminiResponse = objectMapper.readValue(response,GeminiResponse.class);
            if(geminiResponse.getCandidates()!=null && !geminiResponse.getCandidates().isEmpty()){
                GeminiResponse.Candidate firstCandidate=geminiResponse.getCandidates().get(0);
                if(firstCandidate.getContent()!=null && firstCandidate.getContent().getParts()!=null && !firstCandidate.getContent().getParts().isEmpty()){
                    return firstCandidate.getContent().getParts().get(0).getText();
                }
            }
        }catch(Exception e){
            return "Error Parsing";
        }
        return "No relevant content found";
    }

    private String buildPrompt(ResearchRequest request){
        StringBuilder prompt=new StringBuilder();
        switch (request.getOperation()){
            case "summarize":
                prompt.append("Provide a clear and concise summary of the following text in a few sentences\n\n");
                break;
            case "suggest":
                prompt.append("Based on the following content: suggest releated topics and further reading. Formate the " +
                        "response with clear heading and bullet points:\n\n");
                break;
            default:
                throw new IllegalArgumentException("Unknown Operation: "+request.getOperation());

        }
        prompt.append(request.getContent());
        return prompt.toString();
    }
}
